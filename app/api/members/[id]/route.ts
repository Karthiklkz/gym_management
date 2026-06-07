import { NextRequest } from 'next/server';
import { withAuth } from '@/api/middleware/auth';
import { sendResponse, sendError } from '@/api/utils/response';
import prisma from '@/api/db/client';

export const PATCH = withAuth(async (req: NextRequest, user: any, { params }: { params: { id: string } }) => {
  try {
    const memberId = (await (params as any)).id;
    const body = await req.json();
    const { status, paymentStatus } = body;

    // 1. Find Member and their User
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: { 
        user: true, 
        memberships: {
          orderBy: { endDate: 'desc' },
          take: 1
        }
      }
    });

    if (!member) {
      return sendError('Member not found', 404);
    }

    // Verify that the logged in user belongs to the same gym
    if (user.role !== 'SUPER_ADMIN' && member.user.gymId !== user.gymId) {
      return sendError('Access denied', 403);
    }

    // 2. Update User Account Status (ACTIVE/INACTIVE) if provided
    if (status) {
      await prisma.user.update({
        where: { id: member.userId },
        data: { status }
      });
    }

    // 3. Update or create Payment Status if provided
    if (paymentStatus) {
      const activeMembership = member.memberships[0];
      if (activeMembership) {
        // Find latest payment for this membership
        const latestPayment = await prisma.payment.findFirst({
          where: { membershipId: activeMembership.id },
          orderBy: { paidAt: 'desc' }
        });

        if (latestPayment) {
          await prisma.payment.update({
            where: { id: latestPayment.id },
            data: { 
              paymentStatus,
              paidAt: paymentStatus === 'SUCCESS' ? new Date() : null
            }
          });
        } else {
          // Create a payment
          const plan = await prisma.membershipPlan.findUnique({
            where: { id: activeMembership.membershipPlanId }
          });
          await prisma.payment.create({
            data: {
              memberId: member.id,
              membershipId: activeMembership.id,
              amount: plan?.price || 0.00,
              paymentMethod: 'CASH',
              paymentStatus,
              paidAt: paymentStatus === 'SUCCESS' ? new Date() : null,
              transactionId: `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
            }
          });
        }
      } else {
        // Fallback: If no membership exists, let's create a placeholder payment if they have a plan assigned
        const defaultPlan = await prisma.membershipPlan.findFirst({
          where: { gymId: member.user.gymId || undefined }
        });
        if (defaultPlan) {
          const startDate = new Date();
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + defaultPlan.durationDays);

          const membership = await prisma.memberMembership.create({
            data: {
              memberId: member.id,
              membershipPlanId: defaultPlan.id,
              startDate,
              endDate,
              status: 'ACTIVE'
            }
          });

          await prisma.payment.create({
            data: {
              memberId: member.id,
              membershipId: membership.id,
              amount: defaultPlan.price,
              paymentMethod: 'CASH',
              paymentStatus,
              paidAt: paymentStatus === 'SUCCESS' ? new Date() : null,
              transactionId: `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
            }
          });
        }
      }
    }

    // Fetch fully updated member record to return
    const updatedMember = await prisma.member.findUnique({
      where: { id: memberId },
      include: {
        user: {
          include: {
            profile: true,
            gym: {
              select: { name: true }
            }
          }
        },
        memberships: {
          include: {
            membershipPlan: true
          },
          orderBy: { endDate: 'desc' }
        },
        payments: {
          orderBy: { paidAt: 'desc' }
        }
      }
    });

    return sendResponse(updatedMember, 200, 'Member updated successfully');
  } catch (error: any) {
    return sendError(error);
  }
});

export const PUT = withAuth(async (req: NextRequest, user: any, { params }: { params: { id: string } }) => {
  try {
    const memberId = (await (params as any)).id;
    const body = await req.json();
    const { firstName, lastName, phone, emergencyContact, classType, medicalNotes } = body;

    // Find Member
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: { user: true }
    });

    if (!member) {
      return sendError('Member not found', 404);
    }

    // Auth check
    if (user.role !== 'SUPER_ADMIN' && member.user.gymId !== user.gymId) {
      return sendError('Access denied', 403);
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update User phone
      if (phone !== undefined) {
        await tx.user.update({
          where: { id: member.userId },
          data: { phone }
        });
      }

      // 2. Update UserProfile
      await tx.userProfile.update({
        where: { userId: member.userId },
        data: {
          firstName,
          lastName,
          emergencyContact
        }
      });

      // 3. Update Member details (medicalNotes and classType)
      await tx.member.update({
        where: { id: memberId },
        data: {
          medicalNotes,
          classType
        }
      });
    });

    // Fetch updated member record to return
    const updatedMember = await prisma.member.findUnique({
      where: { id: memberId },
      include: {
        user: {
          include: {
            profile: true,
            gym: {
              select: { name: true }
            }
          }
        },
        memberships: {
          include: {
            membershipPlan: true
          },
          orderBy: { endDate: 'desc' }
        },
        payments: {
          orderBy: { paidAt: 'desc' }
        }
      }
    });

    return sendResponse(updatedMember, 200, 'Member details updated successfully');
  } catch (error: any) {
    return sendError(error);
  }
});
