import { 
  createContextId, 
  useContext, 
  useContextProvider, 
  useStore, 
  useVisibleTask$,
  $
} from "@builder.io/qwik";
import { isServer } from "@builder.io/qwik/build";
import { defaultParticleConfigs, type ParticleConfig } from "~/components/effects/particle-background";

export interface GlobalParticleStore {
  config: ParticleConfig;
  isInitialized: boolean;
  userEmail?: string;
}

export const GlobalParticleContext = createContextId<GlobalParticleStore>('global-particle-context');

export const useGlobalParticleProvider = (userEmail?: string) => {
  const store = useStore<GlobalParticleStore>({
    config: { ...defaultParticleConfigs.hearts, enabled: true },
    isInitialized: true,
    userEmail,
  });

  useContextProvider(GlobalParticleContext, store);

  // Load particle config from localStorage (we'll add database sync in the settings page)
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async () => {
    if (isServer) return;
    
    try {
      const saved = localStorage.getItem('global-particle-config');
      if (saved) {
        const parsed = JSON.parse(saved);
        store.config = { ...defaultParticleConfigs.hearts, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to load global particle config from localStorage:', e);
    }
  });

  return store;
};

export const useGlobalParticle = () => {
  return useContext(GlobalParticleContext);
};

export const updateGlobalParticleConfig = $((store: GlobalParticleStore, newConfig: ParticleConfig) => {
  store.config = newConfig;
  
  if (!isServer) {
    try {
      // Always save to localStorage for immediate persistence
      localStorage.setItem('global-particle-config', JSON.stringify(newConfig));
    } catch (e) {
      console.warn('Failed to save global particle config:', e);
    }
  }
});

// Default configurations for different themes
export const themeParticleConfigs: Record<string, ParticleConfig> = {
  hearts: defaultParticleConfigs.hearts,
  snow: defaultParticleConfigs.snow,
  stars: defaultParticleConfigs.stars,
  bubbles: defaultParticleConfigs.bubbles,
  confetti: defaultParticleConfigs.confetti,
  disabled: {
    ...defaultParticleConfigs.hearts,
    enabled: false,
  },
};
