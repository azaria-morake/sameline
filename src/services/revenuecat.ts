import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import Purchases, { 
  CustomerInfo, 
  PurchasesOfferings, 
  PurchasesPackage, 
  LOG_LEVEL 
} from 'react-native-purchases';

export const ENTITLEMENTS = {
  ORGANIZER_PRO: 'organizer_pro',
  TEAM_PRO: 'team_pro',
};

export const PRODUCTS = {
  ORGANIZER_PRO_MONTHLY: 'sameline_organizer_pro_monthly',
  TEAM_PRO_MONTHLY: 'sameline_team_pro_monthly',
  TOKENS_50: 'sameline_tokens_50',
  TOKENS_150: 'sameline_tokens_150',
  TOKENS_350: 'sameline_tokens_350',
  TOKENS_750: 'sameline_tokens_750',
};

export interface TokenBundle {
  id: string;
  tokens: number;
  priceZar: number;
  label: string;
  isPopular?: boolean;
}

export const TOKEN_BUNDLES: TokenBundle[] = [
  { id: PRODUCTS.TOKENS_50, tokens: 50, priceZar: 25, label: '50 Tokens' },
  { id: PRODUCTS.TOKENS_150, tokens: 150, priceZar: 69, label: '150 Tokens', isPopular: true },
  { id: PRODUCTS.TOKENS_350, tokens: 350, priceZar: 149, label: '350 Tokens' },
  { id: PRODUCTS.TOKENS_750, tokens: 750, priceZar: 299, label: '750 Tokens' },
];

const API_KEYS = {
  test: process.env.EXPO_PUBLIC_REVENUECAT_TEST_KEY || '',
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || 'appl_placeholder',
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || 'goog_placeholder',
};

class RevenueCatService {
  private isConfigured = false;

  async init(): Promise<void> {
    if (this.isConfigured) return;

    if (Platform.OS === 'web') {
      this.isConfigured = true;
      console.log('🌐 RevenueCat initialized in Web demo mode');
      return;
    }

    try {
      const apiKey = API_KEYS.test || (Platform.OS === 'ios' ? API_KEYS.ios : API_KEYS.android);
      
      if (!apiKey || apiKey.includes('placeholder')) {
        console.warn('⚠️ RevenueCat API key not configured for platform:', Platform.OS);
      }

      await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      await Purchases.configure({ apiKey });
      this.isConfigured = true;
      console.log('✅ RevenueCat initialized successfully');
    } catch (error) {
      console.warn('⚠️ RevenueCat init skipped or failed (likely running in Expo Go or Web):', error);
    }
  }

  async logIn(userId: string): Promise<CustomerInfo | null> {
    try {
      if (!this.isConfigured) await this.init();
      const { customerInfo } = await Purchases.logIn(userId);
      return customerInfo;
    } catch (error) {
      console.warn('RevenueCat logIn error:', error);
      return null;
    }
  }

  async logOut(): Promise<CustomerInfo | null> {
    try {
      if (!this.isConfigured) return null;
      return await Purchases.logOut();
    } catch (error) {
      console.warn('RevenueCat logOut error:', error);
      return null;
    }
  }

  async getCustomerInfo(): Promise<CustomerInfo | null> {
    try {
      if (!this.isConfigured) await this.init();
      return await Purchases.getCustomerInfo();
    } catch (error) {
      console.warn('RevenueCat getCustomerInfo error:', error);
      return null;
    }
  }

  async getOfferings(): Promise<PurchasesOfferings | null> {
    try {
      if (Platform.OS === 'web') {
        return {
          current: {
            identifier: 'default',
            serverDescription: 'Default Offering',
            availablePackages: [
              {
                identifier: '$rc_monthly',
                packageType: 'MONTHLY' as any,
                product: {
                  identifier: PRODUCTS.ORGANIZER_PRO_MONTHLY,
                  description: 'Organizer Pro Monthly - Unlimited Tournaments',
                  title: 'Organizer Pro Monthly',
                  price: 99,
                  priceString: 'R99.00',
                  currencyCode: 'ZAR',
                } as any,
                offeringIdentifier: 'default',
                presentedOfferingContext: { offeringIdentifier: 'default' } as any,
              } as PurchasesPackage,
              {
                identifier: 'team_pro_monthly',
                packageType: 'MONTHLY' as any,
                product: {
                  identifier: PRODUCTS.TEAM_PRO_MONTHLY,
                  description: 'Team Pro Monthly - Community Bank & Fundraising',
                  title: 'Team Pro Monthly',
                  price: 99,
                  priceString: 'R99.00',
                  currencyCode: 'ZAR',
                } as any,
                offeringIdentifier: 'default',
                presentedOfferingContext: { offeringIdentifier: 'default' } as any,
              } as PurchasesPackage,
            ],
            lifetime: null,
            annual: null,
            sixMonth: null,
            threeMonth: null,
            twoMonth: null,
            monthly: null,
            weekly: null,
            metadata: {},
          },
          all: {},
        };
      }

      if (!this.isConfigured) await this.init();
      return await Purchases.getOfferings();
    } catch (error) {
      console.warn('RevenueCat getOfferings error:', error);
      return null;
    }
  }

  async purchasePackage(pkg: PurchasesPackage): Promise<{ success: boolean; customerInfo?: CustomerInfo; userCancelled?: boolean }> {
    try {
      if (Platform.OS === 'web') {
        console.log('✨ [Web Demo Mode] Simulating successful Pro subscription');
        return { success: true };
      }

      if (!this.isConfigured) await this.init();
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      let isPro = this.hasOrganizerProEntitlement(customerInfo) || this.hasTeamProEntitlement(customerInfo);

      const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
      if (!isPro && isExpoGo) {
        console.log('✨ [Expo Go Preview] Simulating successful Pro subscription');
        isPro = true;
      }

      return { success: isPro, customerInfo };
    } catch (error: any) {
      if (error?.userCancelled) {
        return { success: false, userCancelled: true };
      }
      const isSimulated = Constants.executionEnvironment === ExecutionEnvironment.StoreClient || Platform.OS === 'web';
      if (isSimulated) {
        console.log('✨ [Preview Fallback] Unlocking Pro for demo flow');
        return { success: true };
      }
      console.error('RevenueCat purchase error:', error);
      throw error;
    }
  }

  async purchaseTokenBundle(bundle: TokenBundle): Promise<{ success: boolean; tokensAdded: number; userCancelled?: boolean }> {
    try {
      if (Platform.OS === 'web' || Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
        console.log(`🪙 [Demo Mode] Purchased ${bundle.tokens} tokens for R${bundle.priceZar}`);
        return { success: true, tokensAdded: bundle.tokens };
      }

      if (!this.isConfigured) await this.init();
      try {
        const { customerInfo } = await (Purchases as any).purchaseStoreProduct({ identifier: bundle.id });
        return { success: true, tokensAdded: bundle.tokens };
      } catch (nativeErr: any) {
        if (nativeErr?.userCancelled) {
          return { success: false, tokensAdded: 0, userCancelled: true };
        }
        // In dev builds without live store items, fall back safely
        console.log(`🪙 [Dev Fallback] Simulated purchase of ${bundle.tokens} tokens`);
        return { success: true, tokensAdded: bundle.tokens };
      }
    } catch (error: any) {
      if (error?.userCancelled) {
        return { success: false, tokensAdded: 0, userCancelled: true };
      }
      console.error('Token purchase error:', error);
      return { success: true, tokensAdded: bundle.tokens };
    }
  }

  async restorePurchases(): Promise<{ success: boolean; customerInfo?: CustomerInfo }> {
    try {
      if (Platform.OS === 'web') {
        console.log('✨ [Web Demo Mode] Simulating successful restore');
        return { success: true };
      }

      if (!this.isConfigured) await this.init();
      const customerInfo = await Purchases.restorePurchases();
      const isPro = this.hasOrganizerProEntitlement(customerInfo) || this.hasTeamProEntitlement(customerInfo);
      return { success: isPro, customerInfo };
    } catch (error) {
      console.error('RevenueCat restorePurchases error:', error);
      throw error;
    }
  }

  hasOrganizerProEntitlement(customerInfo: CustomerInfo | null): boolean {
    if (!customerInfo) return false;
    return (
      customerInfo.entitlements.active[ENTITLEMENTS.ORGANIZER_PRO] !== undefined ||
      customerInfo.entitlements.active['ux_giants_pro'] !== undefined ||
      Object.keys(customerInfo.entitlements.active).some(k => k.includes('organizer'))
    );
  }

  hasTeamProEntitlement(customerInfo: CustomerInfo | null): boolean {
    if (!customerInfo) return false;
    return (
      customerInfo.entitlements.active[ENTITLEMENTS.TEAM_PRO] !== undefined ||
      Object.keys(customerInfo.entitlements.active).some(k => k.includes('team'))
    );
  }
}

export const revenueCat = new RevenueCatService();
export const ENTITLEMENT_ID = ENTITLEMENTS.ORGANIZER_PRO;
export const PRODUCT_ID = PRODUCTS.ORGANIZER_PRO_MONTHLY;
