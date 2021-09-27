import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { MaxVaporPlatformAccessory } from './platformAccessory';

const axios = require('axios');

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class MaxVaporPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', this.config.name);

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');
      this.discoverDevices();
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  }

  /**
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  discoverDevices() {
    let self = this;
    const instance = axios.create({
      headers: {'Authorization': "Token " + this.config.token}
    });
    instance.get(this.config.host + "/api/devices/", {headers: {Accept: "application/json"}})
    .then(function (response) {

      // loop over the discovered devices and register each one if it has not already been registered
      for (const device of response.data) {

        // generate a unique id for the accessory this should be generated from
        // something globally unique, but constant, for example, the device serial
        // number or MAC address
        const uuid = self.api.hap.uuid.generate(device.serial);

        // see if an accessory with the same uuid has already been registered and restored from
        // the cached devices we stored in the `configureAccessory` method above
        const existingAccessory = self.accessories.find(accessory => accessory.UUID === uuid);
        if (existingAccessory) {

          // the accessory already exists
          self.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

          // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
          // existingAccessory.context.device = device;
          // this.api.updatePlatformAccessories([existingAccessory]);

          // create the accessory handler for the restored accessory
          // this is imported from `platformAccessory.ts`
          new MaxVaporPlatformAccessory(self, existingAccessory);

          // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
          // remove platform accessories when no longer present
          // this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
          // this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);

        } else {

          // the accessory does not yet exist, so we need to create it
          self.log.info('Adding new accessory:', device.name);

          // create a new accessory
          const accessory = new self.api.platformAccessory(device.name, uuid);

          // store a copy of the device object in the `accessory.context`
          // the `context` property can be used to store any data about the accessory you may need
          accessory.context.device = device;

          // create the accessory handler for the newly create accessory
          // this is imported from `platformAccessory.ts`
          new MaxVaporPlatformAccessory(self, accessory);

          // link the accessory to your platform
          self.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);

        }

      }

    })
    .catch(function (error) {
      self.log.error("Error from API: " + error.response.data.detail);
    });

  }
}
