import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { MaxVaporPlatform } from './platform';

const axios = require('axios');

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class MaxVaporPlatformAccessory {
  private service: Service;

  constructor(
    private readonly platform: MaxVaporPlatform,
    private readonly accessory: PlatformAccessory,
  ) {

    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'DB Electronics')
      .setCharacteristic(this.platform.Characteristic.Model, 'MaxVapor BT')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.context.device.serial);

      this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .getCharacteristic(this.platform.Characteristic.FirmwareRevision)
      .onGet(this.getFirmwareVersion.bind(this));

    // get the Thermostat service if it exists, otherwise create a new Thermostat service
    this.service = this.accessory.getService(this.platform.Service.Thermostat) || this.accessory.addService(this.platform.Service.Thermostat);

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Thermostat
    
    // set props
    this.service.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .setProps({
        maxValue: 648,
        minValue: 0,
        minStep: 1
      });

    this.service.getCharacteristic(this.platform.Characteristic.TargetTemperature)
      .setProps({
        maxValue: 648,
        minValue: 100,
        minStep: 1
      });

    // register 5 required Thermostat Characteristics
    this.service.getCharacteristic(this.platform.Characteristic.CurrentHeatingCoolingState)
      .onGet(this.getCurrentHeatingCoolingState.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.TargetHeatingCoolingState)
      .onGet(this.getCurrentHeatingCoolingState.bind(this))
      .onSet(this.setTargetHeatingCoolingState.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .onGet(this.getCurrentTemperature.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.TargetTemperature)
      .onGet(this.getTargetTemperature.bind(this))
      .onSet(this.setTargetTemperature.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.TemperatureDisplayUnits)
      .onGet(this.getTemperatureDisplayUnits.bind(this))
      .onSet(this.setTemperatureDisplayUnits.bind(this));

  }


  // Return Firmware Version of MaxVapor Device
  async getFirmwareVersion(): Promise<CharacteristicValue> {
    let self = this;
    let version = "Unknown";
    const instance = axios.create({
      headers: {'Authorization': "Token " + self.platform.config.token}
    });
    await instance.get(self.platform.config.host + "/api/device/" + self.accessory.context.device.serial + "/firmware/")
    .then(function (response) {
      version = response.data;
    })
    .catch(function (error) {
      self.platform.log.error("Error from API: " + error.response.data.detail);
    });
    return version;
  }


  // Return the Current Device Temperature
  async getCurrentTemperature(): Promise<CharacteristicValue> {
    let self = this;
    let currentTemperature = 0.0
    const instance = axios.create({
      headers: {'Authorization': "Token " + self.platform.config.token}
    });
    await instance.get(self.platform.config.host + "/api/device/" + self.accessory.context.device.serial + "/temperature/")
    .then(function (response) {
      currentTemperature = response.data;
    })
    .catch(function (error) {
      self.platform.log.error("Error from API: " + error.response.data.detail);
    });
    return currentTemperature;
  }


  // Return the Current Target Temperature
  async getTargetTemperature(): Promise<CharacteristicValue> {
    let self = this;
    let targetTemperature = 0.0
    const instance = axios.create({
      headers: {'Authorization': "Token " + self.platform.config.token}
    });
    await instance.get(self.platform.config.host + "/api/device/" + self.accessory.context.device.serial + "/setpoint/")
    .then(function (response) {
      targetTemperature = response.data;
    })
    .catch(function (error) {
      self.platform.log.error("Error from API: " + error.response.data.detail);
    });
    if(targetTemperature < 100){ targetTemperature = 100.0; }
    return targetTemperature;
  }


  // Return the Current PID State
  async getCurrentHeatingCoolingState(): Promise<CharacteristicValue> {
    let self = this;
    let pidState = this.platform.Characteristic.CurrentHeatingCoolingState.OFF;
    const instance = axios.create({
      headers: {'Authorization': "Token " + self.platform.config.token}
    });
    await instance.get(self.platform.config.host + "/api/device/" + self.accessory.context.device.serial + "/pid_state/")
    .then(function (response) {
      if(response.data == 1){ pidState = self.platform.Characteristic.CurrentHeatingCoolingState.HEAT; }
      else { pidState = self.platform.Characteristic.CurrentHeatingCoolingState.OFF; }
    })
    .catch(function (error) {
      self.platform.log.error("Error from API: " + error.response.data.detail);
    });
    return pidState;
  }


  // Return the current Temperature Unit (Celcius / Fahrenheit)
  async getTemperatureDisplayUnits(): Promise<CharacteristicValue> {
    let self = this;
    let currentUnit = this.platform.Characteristic.TemperatureDisplayUnits.CELSIUS;
    const instance = axios.create({
      headers: {'Authorization': "Token " + self.platform.config.token}
    });
    await instance.get(self.platform.config.host + "/api/device/" + self.accessory.context.device.serial + "/temperature_units/")
    .then(function (response) {
      if(response.data == true){ currentUnit = self.platform.Characteristic.TemperatureDisplayUnits.FAHRENHEIT; }
      else { currentUnit = self.platform.Characteristic.TemperatureDisplayUnits.CELSIUS; }
    })
    .catch(function (error) {
      self.platform.log.error("Error from API: " + error.response.data.detail);
    });
    return currentUnit;
  }


  // Set a new Target  Temperature
  async setTargetTemperature(value: CharacteristicValue) {
    let self = this;
    const instance = axios.create({
      headers: {'Authorization': "Token " + self.platform.config.token}
    });
    await instance.put(
      self.platform.config.host + "/api/device/" + self.accessory.context.device.serial + "/setpoint/",
      { data: value }
    )
    .then(function (response) {
      if(response.data != true){ 
        self.platform.log.error("Could not Set Target Temperature")
      }
    })
    .catch(function (error) {
      self.platform.log.error("Error from API: " + error.response.data.detail);
    });
  }


  // Turn the PID ON or Off
  async setTargetHeatingCoolingState(value: CharacteristicValue) {
    let self = this;
    const instance = axios.create({
      headers: {'Authorization': "Token " + self.platform.config.token}
    });

    // Unsupported Modes
    if(value == self.platform.Characteristic.TargetHeatingCoolingState.AUTO){
      self.platform.log.info("This Device does not support Auto Mode");
      return;
    }
    else if(value == self.platform.Characteristic.TargetHeatingCoolingState.COOL){
      self.platform.log.info("This Device does not support Cooling Mode");
      return;
    }

    await instance.put(
      self.platform.config.host + "/api/device/" + self.accessory.context.device.serial + "/pid_state/",
      { data: value }
    )
    .then(function (response) {
      if(response.data != true){ 
        self.platform.log.error("Could not Set PID State")
      }
    })
    .catch(function (error) {
      self.platform.log.error("Error from API: " + error.response.data.detail);
    });

  }


  // Change Temperature Units
  async setTemperatureDisplayUnits(value: CharacteristicValue) {
    let self = this;
    const instance = axios.create({
      headers: {'Authorization': "Token " + self.platform.config.token}
    });

    await instance.put(
      self.platform.config.host + "/api/device/" + self.accessory.context.device.serial + "/temperature_units/",
      { data: value }
    )
    .then(function (response) {
      if(response.data != true){ 
        self.platform.log.error("Could not Change temperature Units")
      }
    })
    .catch(function (error) {
      self.platform.log.error("Error from API: " + error.response.data.detail);
    });

  }

}
