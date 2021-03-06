import Ember from 'ember';
import config from '../config/environment';
import { walkConfigs, setRTL } from '../utils/locale-utils';

export const DEFAULT_LANGUAGE = config.i18n.defaultLocale || 'en';

export default Ember.Service.extend({
  i18n: Ember.inject.service(),
  config: Ember.inject.service(),

  loadUserLanguagePreference() {
    return Ember.RSVP.hash({
      user: this.getConfig().getCurrentUser(),
      preferences: this.fetchOrCreatePreferences()
    }).then(({ user, preferences }) => user && user.name && preferences[user.name] && preferences[user.name].i18n || DEFAULT_LANGUAGE)
      .catch(() => DEFAULT_LANGUAGE)
      .then(this.setApplicationLanguage.bind(this));
  },

  setApplicationLanguage(selectedLanguage) {

    // Whenever the languague changes, apply RTL settings to application
    let currentConfig = walkConfigs(selectedLanguage, Ember.getOwner(this)) || {};
    setRTL(currentConfig.rtl);

    return Ember.run(() => this.set('i18n.locale', selectedLanguage));
  },

  saveUserLanguagePreference(selectedLanguage) {
    this.setApplicationLanguage(selectedLanguage);
    return Ember.RSVP.hash({
      user: this.getConfig().getCurrentUser(),
      preferences: this.fetchOrCreatePreferences().then(
        (preferences) => preferences,
        () => ({
          _id: 'preferences'
        })
      )
    }).then(({ user, preferences }) => {
      preferences[user.name] = preferences[user.name] || {};
      preferences[user.name].i18n = selectedLanguage;
      return this.getConfig().getConfigDB().put(preferences);
    }).catch((err) => Ember.Logger.error(err));
  },

  fetchOrCreatePreferences() {
    return this.getConfig().getConfigDB().get('preferences');
  },

  getConfig() {
    return this.get('config');
  }
});
