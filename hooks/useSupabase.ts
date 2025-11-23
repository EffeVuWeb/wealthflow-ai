import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
    Transaction, Account, Budget, Goal, Loan, Debt, Subscription, Invoice, Investment, RecurringTransaction, DashboardWidget
} from '../types';

const toSnakeCase = (str: string) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
const toCamelCase = (str: string) => str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());

const mapKeys = (obj: any, fn: (key: string) => string): any => {
    if (Array.isArray(obj)) return obj.map(i => mapKeys(i, fn));
    if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
        return Object.keys(obj).reduce((acc, key) => {
            acc[fn(key)] = mapKeys(obj[key], fn);
            return acc;
        }, {} as any);
    }
    return obj;
};

export const useSupabase = () => {

    const fetchData = useCallback(async (table: string) => {
        const { data, error } = await supabase.from(table).select('*');
        if (error) throw error;
        return mapKeys(data, toCamelCase);
    }, []);

    const addData = useCallback(async (table: string, item: any) => {
        const { data: { user } } = await supabase.auth.getUser();
        const snakeItem = mapKeys(item, toSnakeCase);

        if (user) {
            snakeItem.user_id = user.id;
        }

        const { data, error } = await supabase.from(table).insert(snakeItem).select().single();
        if (error) throw error;
        return mapKeys(data, toCamelCase);
    }, []);

    const updateData = useCallback(async (table: string, id: string, updates: any) => {
        const snakeUpdates = mapKeys(updates, toSnakeCase);
        const { data, error } = await supabase.from(table).update(snakeUpdates).eq('id', id).select().single();
        if (error) throw error;
        return mapKeys(data, toCamelCase);
    }, []);

    const deleteData = useCallback(async (table: string, id: string) => {
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) throw error;
    }, []);

    return {
        fetchData,
        addData,
        updateData,
        deleteData
    };
};
