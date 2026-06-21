export interface Member {
  id: string;
  userId: string;
  joinDate: Date;
  medicalNotes?: string;
}

export interface MemberMembership {
  id: string;
  memberId: string;
  membershipPlanId: string;
  startDate: Date;
  endDate: Date;
  status: string;
}
