console.log('Happy developing ✨')
export interface Note {
    id?: number;
    title: string;
    content: string;
    updatedAt: number;
}

export interface Debt {
    id?: number;
    type: 'owe_me' | 'i_owe';
    name: string;
    amount: number;
    dateEpochDay: number;
    description: string;
}