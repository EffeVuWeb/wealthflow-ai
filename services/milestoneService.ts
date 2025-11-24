import { Goal } from '../types';

export interface MilestoneInfo {
    percentage: number;
    reached: boolean;
    isNew: boolean; // Just reached this milestone
    message: string;
    color: string;
}

export interface GoalPrediction {
    estimatedCompletionDate: string | null;
    daysRemaining: number | null;
    dailySavingsRate: number;
    onTrack: boolean;
}

/**
 * Calculate which milestones have been reached for a goal
 */
export const calculateMilestones = (goal: Goal): MilestoneInfo[] => {
    const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
    const milestones = [25, 50, 75, 100];

    return milestones.map(percentage => {
        const reached = progress >= percentage;
        const isNew = reached && (goal.lastCelebrated || 0) < percentage;

        return {
            percentage,
            reached,
            isNew,
            message: getMilestoneMessage(percentage, goal.name),
            color: getMilestoneColor(percentage)
        };
    });
};

/**
 * Get celebration message for a milestone
 */
const getMilestoneMessage = (percentage: number, goalName: string): string => {
    const messages: Record<number, string> = {
        25: `🎉 Ottimo inizio! Hai raggiunto il 25% di "${goalName}"!`,
        50: `🚀 Sei a metà strada! 50% di "${goalName}" completato!`,
        75: `⭐ Quasi ci sei! 75% di "${goalName}" raggiunto!`,
        100: `🎊 OBIETTIVO RAGGIUNTO! Hai completato "${goalName}"! 🏆`
    };
    return messages[percentage] || '';
};

/**
 * Get color for milestone indicator
 */
const getMilestoneColor = (percentage: number): string => {
    const colors: Record<number, string> = {
        25: '#3b82f6', // blue
        50: '#06b6d4', // cyan
        75: '#f59e0b', // yellow
        100: '#10b981'  // green
    };
    return colors[percentage] || '#64748b';
};

/**
 * Predict when goal will be completed based on savings rate
 */
export const predictGoalCompletion = (goal: Goal, transactions: any[]): GoalPrediction => {
    if (!goal.createdAt || goal.currentAmount >= goal.targetAmount) {
        return {
            estimatedCompletionDate: null,
            daysRemaining: null,
            dailySavingsRate: 0,
            onTrack: goal.currentAmount >= goal.targetAmount
        };
    }

    const createdDate = new Date(goal.createdAt);
    const today = new Date();
    const daysSinceCreation = Math.max(1, Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));

    // Calculate daily savings rate
    const dailySavingsRate = goal.currentAmount / daysSinceCreation;

    if (dailySavingsRate <= 0) {
        return {
            estimatedCompletionDate: null,
            daysRemaining: null,
            dailySavingsRate: 0,
            onTrack: false
        };
    }

    // Calculate days needed to reach target
    const remainingAmount = goal.targetAmount - goal.currentAmount;
    const daysNeeded = Math.ceil(remainingAmount / dailySavingsRate);

    const estimatedDate = new Date(today);
    estimatedDate.setDate(estimatedDate.getDate() + daysNeeded);

    // Check if on track (if deadline exists)
    let onTrack = true;
    if (goal.deadline) {
        const deadlineDate = new Date(goal.deadline);
        onTrack = estimatedDate <= deadlineDate;
    }

    return {
        estimatedCompletionDate: estimatedDate.toISOString(),
        daysRemaining: daysNeeded,
        dailySavingsRate,
        onTrack
    };
};

/**
 * Get the next uncelebrated milestone
 */
export const getNextMilestone = (goal: Goal): MilestoneInfo | null => {
    const milestones = calculateMilestones(goal);
    return milestones.find(m => m.isNew) || null;
};
