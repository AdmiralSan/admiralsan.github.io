-- Fix the trigger function to properly handle both payments and ledger_entries tables

CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- This function can be used to automatically update account balances
    -- when payments or ledger entries are added/updated/deleted
    
    IF TG_OP = 'INSERT' THEN
        -- Update account balance based on the transaction type
        -- Check if this is a ledger entry (has entry_type field)
        IF TG_TABLE_NAME = 'ledger_entries' THEN
            IF NEW.entry_type = 'income' THEN
                UPDATE public.accounts 
                SET current_balance = current_balance + NEW.amount,
                    updated_at = NOW()
                WHERE id = NEW.account_id;
            ELSIF NEW.entry_type = 'expense' THEN
                UPDATE public.accounts 
                SET current_balance = current_balance - NEW.amount,
                    updated_at = NOW()
                WHERE id = NEW.account_id;
            END IF;
        -- Check if this is a payment (has payment_type field)
        ELSIF TG_TABLE_NAME = 'payments' THEN
            IF NEW.payment_type = 'received' THEN
                UPDATE public.accounts 
                SET current_balance = current_balance + NEW.amount,
                    updated_at = NOW()
                WHERE id = NEW.account_id;
            ELSIF NEW.payment_type = 'sent' THEN
                UPDATE public.accounts 
                SET current_balance = current_balance - NEW.amount,
                    updated_at = NOW()
                WHERE id = NEW.account_id;
            END IF;
        END IF;
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'UPDATE' THEN
        -- Handle balance updates for modified records
        -- This would require more complex logic to handle the difference
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        -- Reverse the balance change
        -- Check if this is a ledger entry (has entry_type field)
        IF TG_TABLE_NAME = 'ledger_entries' THEN
            IF OLD.entry_type = 'income' THEN
                UPDATE public.accounts 
                SET current_balance = current_balance - OLD.amount,
                    updated_at = NOW()
                WHERE id = OLD.account_id;
            ELSIF OLD.entry_type = 'expense' THEN
                UPDATE public.accounts 
                SET current_balance = current_balance + OLD.amount,
                    updated_at = NOW()
                WHERE id = OLD.account_id;
            END IF;
        -- Check if this is a payment (has payment_type field)
        ELSIF TG_TABLE_NAME = 'payments' THEN
            IF OLD.payment_type = 'received' THEN
                UPDATE public.accounts 
                SET current_balance = current_balance - OLD.amount,
                    updated_at = NOW()
                WHERE id = OLD.account_id;
            ELSIF OLD.payment_type = 'sent' THEN
                UPDATE public.accounts 
                SET current_balance = current_balance + OLD.amount,
                    updated_at = NOW()
                WHERE id = OLD.account_id;
            END IF;
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
