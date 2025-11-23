import { Badge, FinancialSummary, Investment, Debt, Loan, Budget, Transaction } from '../types';

export const BADGES_DEFINITIONS: Badge[] = [
    {
        id: 'first_steps',
        name: 'Primi Passi',
        description: 'Hai iniziato a tracciare le tue finanze!',
        icon: 'Footprints',
        unlocked: false,
        color: 'blue'
    },
    {
        id: 'positive_balance',
        name: 'In Verde',
        description: 'Il tuo saldo totale è positivo.',
        icon: 'TrendingUp',
        unlocked: false,
        color: 'emerald'
    },
    {
        id: 'saver',
        name: 'Formica',
        description: 'Hai un tasso di risparmio superiore al 20%.',
        icon: 'PiggyBank',
        unlocked: false,
        color: 'amber'
    },
    {
        id: 'investor_junior',
        name: 'Investitore Junior',
        description: 'Hai investito i tuoi primi 1.000€.',
        icon: 'Sprout',
        unlocked: false,
        color: 'indigo'
    },
    {
        id: 'debt_free',
        name: 'Senza Catene',
        description: 'Non hai debiti personali in sospeso.',
        icon: 'Unlock',
        unlocked: false,
        color: 'cyan'
    },
    {
        id: 'shark',
        name: 'Squalo',
        description: 'Il tuo patrimonio netto supera i 10.000€.',
        icon: 'Gem',
        unlocked: false,
        color: 'violet'
    },
    {
        id: 'diversified',
        name: 'Diversificatore',
        description: 'Hai investimenti in almeno 3 categorie diverse.',
        icon: 'PieChart',
        unlocked: false,
        color: 'fuchsia'
    },
    {
        id: 'planner',
        name: 'Pianificatore',
        description: 'Hai impostato almeno 3 budget.',
        icon: 'Target',
        unlocked: false,
        color: 'rose'
    }
];

export const calculateBadges = (
    summary: FinancialSummary,
    investments: Investment[],
    debts: Debt[],
    loans: Loan[],
    budgets: Budget[],
    transactions: Transaction[]
): Badge[] => {
    const badges = BADGES_DEFINITIONS.map(badge => ({ ...badge }));

    // 1. First Steps (Always unlocked if using the app)
    badges[0].unlocked = true;
    badges[0].progress = 100;

    // 2. Positive Balance
    badges[1].unlocked = summary.balance > 0;
    badges[1].progress = summary.balance > 0 ? 100 : 0;

    // 3. Saver (> 20% savings rate)
    badges[2].unlocked = summary.savingsRate >= 20;
    badges[2].progress = Math.min(100, (summary.savingsRate / 20) * 100);

    // 4. Investor Junior (> 1000 invested)
    const totalInvested = investments.reduce((sum, inv) => sum + (inv.quantity * inv.currentPrice), 0);
    badges[3].unlocked = totalInvested >= 1000;
    badges[3].progress = Math.min(100, (totalInvested / 1000) * 100);

    // 5. Debt Free (No personal debts)
    const hasDebts = debts.some(d => !d.isPaid);
    badges[4].unlocked = !hasDebts;
    badges[4].progress = !hasDebts ? 100 : 0;

    // 6. Shark (> 10k Net Worth)
    badges[5].unlocked = summary.netWorth >= 10000;
    badges[5].progress = Math.min(100, (summary.netWorth / 10000) * 100);

    // 7. Diversified (3+ investment categories)
    const uniqueCategories = new Set(investments.map(i => i.category));
    badges[6].unlocked = uniqueCategories.size >= 3;
    badges[6].progress = Math.min(100, (uniqueCategories.size / 3) * 100);

    // 8. Planner (3+ budgets)
    badges[7].unlocked = budgets.length >= 3;
    badges[7].progress = Math.min(100, (budgets.length / 3) * 100);

    return badges;
};
