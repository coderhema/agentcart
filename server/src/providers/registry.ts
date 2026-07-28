import { ProviderInterface, LinkedinProvider, TwitterProvider, WeatherProvider, EmailProvider } from './types.js';
import { config } from '../config.js';

class ProviderRegistry {
  private providers = new Map<string, ProviderInterface>();

  register(provider: ProviderInterface) {
    this.providers.set(provider.name, provider);
  }

  get(name: string): ProviderInterface | undefined {
    return this.providers.get(name);
  }

  getAll(): ProviderInterface[] {
    return Array.from(this.providers.values());
  }
}

export const registry = new ProviderRegistry();

registry.register(new LinkedinProvider(
  config.providers.linkedin.apiKey,
  config.providers.linkedin.baseUrl
));
registry.register(new TwitterProvider());
registry.register(new WeatherProvider());
registry.register(new EmailProvider());