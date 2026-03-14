import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { defaultPricingConfig } from '../types/pricingConfig';
import type { PricingConfig } from '../types/pricingConfig';
import type { ReactNode } from 'react';

interface PricingContextType {
    config: PricingConfig;
    loading: boolean;
    refreshConfig: () => void;
}

const PricingContext = createContext<PricingContextType>({
    config: defaultPricingConfig,
    loading: true,
    refreshConfig: () => { }
});

export const usePricing = () => useContext(PricingContext);

export const PricingProvider = ({ children }: { children: ReactNode }) => {
    const [config, setConfig] = useState<PricingConfig>(defaultPricingConfig);
    const [loading, setLoading] = useState(true);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/pricing');
            if (response.data) {
                setConfig(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch pricing config:', error);
            // Default config is already set, so we just proceed
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    return (
        <PricingContext.Provider value={{ config, loading, refreshConfig: fetchConfig }}>
            {children}
        </PricingContext.Provider>
    );
};
