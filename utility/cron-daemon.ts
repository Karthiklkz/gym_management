import 'dotenv/config';
import cron from 'node-cron';
import prisma from '../api/db/client';

console.log('[CRON DAEMON] Starting PeakPulse Elite background automation process...');

// Task 1: Membership Expiration Sweep (Daily at 12:00 AM)
// Cron Expression: 0 0 * * *
cron.schedule('0 0 * * *', async () => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Running Membership Expiration Sweep...`);

  try {
    const now = new Date();
    
    // Find all memberships that are ACTIVE but past their end date
    const expiredMemberships = await prisma.memberMembership.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { lt: now }
      },
      include: {
        member: {
          include: {
            user: true
          }
        }
      }
    });

    console.log(`[${timestamp}] Found ${expiredMemberships.length} memberships past expiration.`);

    for (const membership of expiredMemberships) {
      await prisma.$transaction(async (tx) => {
        // 1. Mark membership as EXPIRED
        await tx.memberMembership.update({
          where: { id: membership.id },
          data: { status: 'EXPIRED' }
        });

        // 2. Check if user has any other ACTIVE membership plan in the database
        const activeCount = await tx.memberMembership.count({
          where: {
            memberId: membership.memberId,
            status: 'ACTIVE',
            endDate: { gte: now }
          }
        });

        // 3. If no active memberships are left, mark User status as INACTIVE
        if (activeCount === 0) {
          await tx.user.update({
            where: { id: membership.member.userId },
            data: { status: 'INACTIVE' }
          });

          // 4. Create expiration notification
          await tx.notification.create({
            data: {
              userId: membership.member.userId,
              title: 'Membership Expired',
              message: 'Your active membership plan has expired. Please visit the front desk to renew your plan.',
              notificationType: 'SYSTEM'
            }
          });

          console.log(`[${timestamp}] Inactivated user ${membership.member.user.email} due to expired membership.`);
        }

        // 5. Create audit log
        await tx.auditLog.create({
          data: {
            userId: membership.member.userId,
            action: 'MEMBERSHIP_AUTO_EXPIRED',
            entity: 'MemberMembership',
            entityId: membership.id,
            metadata: { memberId: membership.memberId }
          }
        });
      });
    }

    console.log(`[${timestamp}] Membership Expiration Sweep completed successfully.`);
  } catch (error) {
    console.error(`[${timestamp}] Error during Membership Expiration Sweep:`, error);
  }
});

// Task 2: Forgot-to-Checkout Auto-Checkout Sweep (Daily at 11:00 PM)
// Cron Expression: 0 23 * * *
cron.schedule('0 23 * * *', async () => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Running Auto-Checkout Sweep...`);

  try {
    // Find all active attendance records that do not have checkOut set
    const activeSessions = await prisma.attendance.findMany({
      where: {
        checkOut: null
      },
      include: {
        member: true
      }
    });

    console.log(`[${timestamp}] Found ${activeSessions.length} active sessions with missing check-outs.`);

    for (const session of activeSessions) {
      await prisma.$transaction(async (tx) => {
        // Auto check-out time is checkIn + 2 hours
        const autoCheckOutTime = new Date(session.checkIn.getTime() + 2 * 60 * 60 * 1000);

        // Update attendance log
        await tx.attendance.update({
          where: { id: session.id },
          data: { checkOut: autoCheckOutTime }
        });

        // Write Audit Log
        await tx.auditLog.create({
          data: {
            userId: session.member.userId,
            action: 'MEMBER_AUTO_CHECK_OUT',
            entity: 'Attendance',
            entityId: session.id,
            metadata: { memberId: session.memberId, autoCheckOut: true }
          }
        });
      });
      console.log(`[${timestamp}] Auto-checked out session ID: ${session.id} for member ID: ${session.memberId}`);
    }

    console.log(`[${timestamp}] Auto-Checkout Sweep completed successfully.`);
  } catch (error) {
    console.error(`[${timestamp}] Error during Auto-Checkout Sweep:`, error);
  }
});

// Task 3: Expiration Warnings (Pre-Expiry Notifications daily at 9:00 AM)
// Cron Expression: 0 9 * * *
cron.schedule('0 9 * * *', async () => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Running Pre-Expiry Warning Sweep...`);

  try {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 3);
    const startOfTarget = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfTarget = new Date(targetDate.setHours(23, 59, 59, 999));

    // Find all active memberships that will expire in exactly 3 days
    const warnings = await prisma.memberMembership.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: startOfTarget,
          lte: endOfTarget
        }
      },
      include: {
        member: true
      }
    });

    console.log(`[${timestamp}] Found ${warnings.length} memberships expiring in 3 days.`);

    for (const membership of warnings) {
      await prisma.notification.create({
        data: {
          userId: membership.member.userId,
          title: 'Membership Expiring Soon',
          message: 'Your membership plan will expire in 3 days. Please renew soon to avoid gym check-in interruptions!',
          notificationType: 'REMINDER'
        }
      });
      console.log(`[${timestamp}] Sent 3-day warning notification to user ID: ${membership.member.userId}`);
    }

    console.log(`[${timestamp}] Pre-Expiry Warning Sweep completed successfully.`);
  } catch (error) {
    console.error(`[${timestamp}] Error during Pre-Expiry Warning Sweep:`, error);
  }
});

console.log('[CRON DAEMON] Daemon script loaded. Schedulers initialized. Running...');
