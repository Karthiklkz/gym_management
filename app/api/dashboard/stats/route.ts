import { NextRequest } from 'next/server';
import { withAuth } from '@/api/middleware/auth';
import { sendResponse, sendError } from '@/api/utils/response';
import prisma from '@/api/db/client';

export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    const gymId = user.gymId;
    const granularity = req.nextUrl.searchParams.get('granularity') || 'monthly';

    // 1. Calculate History Window
    const historyStart = new Date();
    if (granularity === 'daily') {
      historyStart.setDate(historyStart.getDate() - 29);
      historyStart.setHours(0, 0, 0, 0);
    } else if (granularity === 'yearly') {
      historyStart.setFullYear(historyStart.getFullYear() - 2);
      historyStart.setMonth(0);
      historyStart.setDate(1);
      historyStart.setHours(0, 0, 0, 0);
    } else { // monthly
      historyStart.setMonth(historyStart.getMonth() - 5);
      historyStart.setDate(1);
      historyStart.setHours(0, 0, 0, 0);
    }

    // 2. Fetch standard dashboard overview aggregates
    let totalMembers = 0;
    let totalTrainers = 0;
    let activePlans = 0;
    let monthlyRevenue = 0;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    if (user.role === 'SUPER_ADMIN') {
      totalMembers = await prisma.member.count();
      totalTrainers = await prisma.trainer.count();
      activePlans = await prisma.gym.count();

      const payments = await prisma.payment.findMany({
        where: {
          paymentStatus: 'SUCCESS',
          paidAt: { gte: startOfMonth }
        },
        select: { amount: true }
      });
      monthlyRevenue = payments.reduce((acc, curr) => acc + Number(curr.amount), 0);
    } else {
      if (gymId) {
        totalMembers = await prisma.member.count({
          where: { user: { gymId } }
        });
        totalTrainers = await prisma.trainer.count({
          where: { user: { gymId } }
        });
        activePlans = await prisma.memberMembership.count({
          where: {
            status: 'ACTIVE',
            member: { user: { gymId } }
          }
        });

        const payments = await prisma.payment.findMany({
          where: {
            paymentStatus: 'SUCCESS',
            paidAt: { gte: startOfMonth },
            member: { user: { gymId } }
          },
          select: { amount: true }
        });
        monthlyRevenue = payments.reduce((acc, curr) => acc + Number(curr.amount), 0);
      }
    }

    // 3. Fetch successful payments and member acquisitions in history window
    const paymentsHistory = await prisma.payment.findMany({
      where: {
        paymentStatus: 'SUCCESS',
        paidAt: { gte: historyStart },
        ...(user.role !== 'SUPER_ADMIN' ? { member: { user: { gymId } } } : {})
      },
      select: {
        amount: true,
        paidAt: true
      }
    });

    const membersHistory = await prisma.member.findMany({
      where: {
        joinDate: { gte: historyStart },
        ...(user.role !== 'SUPER_ADMIN' ? { user: { gymId } } : {})
      },
      select: {
        joinDate: true
      }
    });

    // 4. Construct History Buckets
    const chartData: { label: string; revenue: number; memberCount: number }[] = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    if (granularity === 'daily') {
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const label = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
        const dateStr = d.toISOString().split('T')[0];
        
        let dayRevenue = 0;
        let dayMembers = 0;

        paymentsHistory.forEach(p => {
          if (p.paidAt && new Date(p.paidAt).toISOString().split('T')[0] === dateStr) {
            dayRevenue += Number(p.amount);
          }
        });

        membersHistory.forEach(mem => {
          if (new Date(mem.joinDate).toISOString().split('T')[0] === dateStr) {
            dayMembers += 1;
          }
        });

        chartData.push({ label, revenue: dayRevenue, memberCount: dayMembers });
      }
    } else if (granularity === 'yearly') {
      const currentYear = new Date().getFullYear();
      for (let y = currentYear - 2; y <= currentYear; y++) {
        let yearRevenue = 0;
        let yearMembers = 0;

        paymentsHistory.forEach(p => {
          if (p.paidAt && new Date(p.paidAt).getFullYear() === y) {
            yearRevenue += Number(p.amount);
          }
        });

        membersHistory.forEach(mem => {
          if (new Date(mem.joinDate).getFullYear() === y) {
            yearMembers += 1;
          }
        });

        chartData.push({ label: String(y), revenue: yearRevenue, memberCount: yearMembers });
      }
    } else { // monthly
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const m = d.getMonth();
        const y = d.getFullYear();
        const label = `${monthNames[m]} ${y}`;
        
        let monthRevenue = 0;
        let monthMembers = 0;

        paymentsHistory.forEach(p => {
          if (p.paidAt) {
            const dateObj = new Date(p.paidAt);
            if (dateObj.getMonth() === m && dateObj.getFullYear() === y) {
              monthRevenue += Number(p.amount);
            }
          }
        });

        membersHistory.forEach(mem => {
          const dateObj = new Date(mem.joinDate);
          if (dateObj.getMonth() === m && dateObj.getFullYear() === y) {
            monthMembers += 1;
          }
        });

        chartData.push({ label, revenue: monthRevenue, memberCount: monthMembers });
      }
    }

    return sendResponse({
      totalMembers,
      totalTrainers,
      activePlans,
      monthlyRevenue,
      chartHistory: chartData,
      isSuperAdmin: user.role === 'SUPER_ADMIN',
    });
  } catch (error: any) {
    return sendError(error);
  }
});
