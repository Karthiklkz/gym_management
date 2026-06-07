import { NextRequest } from 'next/server';
import { withRole } from '@/api/middleware/auth';
import prisma from '@/api/db/client';
import { success, serverError, forbidden } from '@/api/utils/response';

// GET: Paginated list of members in the trainer's branch
export const GET = withRole(['TRAINER'], async (req: NextRequest, user: any) => {
  try {
    const { userId, gymId, branchId } = user;

    if (!gymId || !branchId) {
      return forbidden("Trainer is not assigned to a gym and branch");
    }

    // Verify trainer is active
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { status: true }
    });
    if (!dbUser || dbUser.status !== 'ACTIVE') {
      return forbidden("Trainer account is inactive");
    }

    // Get search parameters
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || ''; // active, expired, cancelled

    const skip = (page - 1) * limit;

    // Build query filters
    const where: any = {
      user: {
        gymId,
        branchId,
        role: 'MEMBER'
      }
    };

    if (search) {
      where.OR = [
        { memberId: { contains: search, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { email: { contains: search, mode: 'insensitive' } },
              { profile: { firstName: { contains: search, mode: 'insensitive' } } },
              { profile: { lastName: { contains: search, mode: 'insensitive' } } }
            ]
          }
        }
      ];
    }

    if (status) {
      where.memberships = {
        some: {
          status: status.toUpperCase()
        }
      };
    }

    // Fetch members with total count
    const [members, total] = await prisma.$transaction([
      prisma.member.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          joinDate: true,
          memberId: true,
          classType: true,
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              status: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  gender: true,
                  profileImage: true
                }
              }
            }
          },
          memberships: {
            select: {
              id: true,
              startDate: true,
              endDate: true,
              status: true,
              membershipPlan: {
                select: {
                  name: true,
                  price: true
                }
              }
            },
            orderBy: {
              endDate: 'desc'
            },
            take: 1
          },
          payments: {
            select: {
              id: true,
              paymentStatus: true,
              paidAt: true
            },
            orderBy: {
              paidAt: 'desc'
            },
            take: 1
          }
        },
        orderBy: {
          joinDate: 'desc'
        }
      }),
      prisma.member.count({ where })
    ]);

    return success({
      members,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    return serverError(error);
  }
});
