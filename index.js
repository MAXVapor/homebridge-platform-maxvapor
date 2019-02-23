const request = require('request');

var Accessory, Service, Characteristic, UUIDGen;

module.exports = function (homebridge) {

  console.log("homebridge API version: " + homebridge.version);

  Accessory = homebridge.platformAccessory;
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  UUIDGen = homebridge.hap.uuid;

  homebridge.registerPlatform("homebridge-platform-maxvapor", "MaxVapor", MaxVapor, true);

}

function MaxVapor(log, config, api) {
  log("MaxVapor Platform Init");
  var platform = this;
  this.log = log;
  this.config = config;
  this.accessories = [];

  this.host = "https://dashboard.maxvapor.com";

  if (api) {
    this.api = api;
    this.api.on('didFinishLaunching', function () {
      platform.api.unregisterPlatformAccessories("homebridge-platform-maxvapor", "MaxVapor", this.accessories);
      platform.discoverDevices();
      setInterval(function(){ platform.discoverDevices(); }, 5000);      
    }.bind(this));
  }
}

MaxVapor.prototype.configureAccessory = function (accessory) {
  this.log(accessory.displayName, "Configure Accessory");
  accessory.reachable = true;
  this.accessories.push(accessory);
}

MaxVapor.prototype.addAccessory = function (accessory) {

  var platform = this;
  var uuid;
  uuid = UUIDGen.generate(accessory.serial);

  // Check Accessory Already Exists
  let exists = false;
  this.accessories.forEach(function (existing) {
    if(uuid === existing.UUID){ exists = true; }
  });
  if(exists){ return; }

  this.log("Add Accessory [" + accessory.serial + "] -> " + accessory.name);
  var newAccessory = new Accessory("MaxVapor E-Nail", uuid);

  newAccessory.on('identify', function (paired, callback) {
    platform.log(newAccessory.displayName, accessory.serial);
    callback();
  });

  newAccessory.getService(Service.AccessoryInformation)
    .setCharacteristic(Characteristic.Manufacturer, "DB Electronics")
    .setCharacteristic(Characteristic.Model, "MaxVapor BT")
    .setCharacteristic(Characteristic.SerialNumber, accessory.serial);

  newAccessory.getService(Service.AccessoryInformation)
    .getCharacteristic(Characteristic.FirmwareRevision)
    .on('get', this.getFirmwareVersion.bind(this));

  this.service = newAccessory.addService(Service.Thermostat, accessory.name);
  this.service.context = {
    'serial': accessory.serial
  };

  this.service.getCharacteristic(Characteristic.CurrentTemperature)
    .on('get', this.getCurrentTemperature.bind(this));

  this.service.getCharacteristic(Characteristic.CurrentTemperature)
    .setProps({
      maxValue: 648,
      minValue: 0,
      minStep: 1
    });

  this.service.getCharacteristic(Characteristic.TargetTemperature)
    .on('get', this.getTargetTemperature.bind(this))
    .on('set', this.setTargetTemperature.bind(this));

  this.service.getCharacteristic(Characteristic.TargetTemperature)
    .setProps({
      maxValue: 648,
      minValue: 100,
      minStep: 1
    });

  this.service.getCharacteristic(Characteristic.TemperatureDisplayUnits)
    .on('get', this.getTemperatureDisplayUnits.bind(this))
    .on('set', this.setTemperatureDisplayUnits.bind(this));

  this.service.getCharacteristic(Characteristic.CurrentHeatingCoolingState)
    .on('get', this.getCurrentHeatingCoolingState.bind(this));

  this.service.getCharacteristic(Characteristic.TargetHeatingCoolingState)
    .on('get', this.getCurrentHeatingCoolingState.bind(this))
    .on('set', this.setTargetHeatingCoolingState.bind(this));

  this.accessories.push(newAccessory);
  this.api.registerPlatformAccessories("homebridge-platform-maxvapor", "MaxVapor", [newAccessory]);
}

MaxVapor.prototype.discoverDevices = function () {

  let deviceEndpoint = (this.host + "/api/device/");
  let self = this;

  request.get(deviceEndpoint, {
    'headers': {
      'Authorization': "Token " + this.config.token,
    },
    'json': true
  }, (err, res, body) => {
    if (err) {
      return this.log(err);
    }

    if (res.statusCode == 401) {
      return this.log("Could not connect to MaxVapor API, please verify your credentials.");
    }

    body.forEach(function (e) {
      self.addAccessory(e);
    });

  });

}

MaxVapor.prototype.getTemperatureDisplayUnits = function (callback) {
  let serialNumber = this.service.context['serial'];
  let dataEndpoint = (this.host + "/api/device/" + serialNumber + "/temperature_units/");
  request.get(dataEndpoint, {
    'headers': {
      'Authorization': "Token " + this.config.token,
    },
    'json': true
  }, (err, res, body) => {
    if (err) {
      return callback("Error Retrieving Data");
    } else if ("Error: " + res.statusCode == 401) {
      return callback("Error Retrieving Data");
    }
    if (body == true) {
      callback(null, Characteristic.TemperatureDisplayUnits.FAHRENHEIT);
    } else {
      callback(null, Characteristic.TemperatureDisplayUnits.CELSIUS);
    }
  });
}

MaxVapor.prototype.getFirmwareVersion = function (callback) {
  let serialNumber = this.service.context['serial'];
  let dataEndpoint = (this.host + "/api/device/" + serialNumber + "/firmware/");
  request.get(dataEndpoint, {
    'headers': {
      'Authorization': "Token " + this.config.token,
    },
    'json': true
  }, (err, res, body) => {
    if (err) {
      return callback("Error Retrieving Data");
    } else if ("Error: " + res.statusCode == 401) {
      return callback("Error Retrieving Data");
    }
    callback(null, body);
  });
}

MaxVapor.prototype.getCurrentTemperature = function (callback) {
  let serialNumber = this.service.context['serial'];
  let dataEndpoint = (this.host + "/api/device/" + serialNumber + "/temperature/");
  request.get(dataEndpoint, {
    'headers': {
      'Authorization': "Token " + this.config.token,
    },
    'json': true
  }, (err, res, body) => {
    if (err) {
      return callback("Error Retrieving Data");
    } else if ("Error: " + res.statusCode == 401) {
      return callback("Error Retrieving Data");
    }
    callback(null, body);
  });
}

MaxVapor.prototype.getTargetTemperature = function (callback) {
  let serialNumber = this.service.context['serial'];
  let dataEndpoint = (this.host + "/api/device/" + serialNumber + "/setpoint/");
  request.get(dataEndpoint, {
    'headers': {
      'Authorization': "Token " + this.config.token,
    },
    'json': true
  }, (err, res, body) => {
    if (err) {
      return callback("Error Retrieving Data");
    } else if ("Error: " + res.statusCode == 401) {
      return callback("Error Retrieving Data");
    }
    callback(null, body);
  });
}

MaxVapor.prototype.getCurrentHeatingCoolingState = function (callback) {
  let serialNumber = this.service.context['serial'];
  let dataEndpoint = (this.host + "/api/device/" + serialNumber + "/pid_state/");
  request.get(dataEndpoint, {
    'headers': {
      'Authorization': "Token " + this.config.token,
    },
    'json': true
  }, (err, res, body) => {
    if (err) {
      return callback("Error Retrieving Data");
    } else if ("Error: " + res.statusCode == 401) {
      return callback("Error Retrieving Data");
    }
    if (body == 1) {
      callback(null, Characteristic.CurrentHeatingCoolingState.HEAT)
    } else {
      callback(null, Characteristic.CurrentHeatingCoolingState.OFF)
    }
  });
}

MaxVapor.prototype.setTemperatureDisplayUnits = function (value, callback) {
  let serialNumber = this.service.context['serial'];
  let dataEndpoint = (this.host + "/api/device/" + serialNumber + "/temperature_units/");
  request.put(dataEndpoint, {
    'headers': {
      'Authorization': "Token " + this.config.token,
    },
    'body': {"data": value},
    'json': true
  }, (err, res, body) => {
    if (err) {
      return callback("Error Retrieving Data");
    } else if ("Error: " + res.statusCode == 401) {
      return callback("Error Retrieving Data");
    }
    callback(null);
  });
}

MaxVapor.prototype.setTargetHeatingCoolingState = function (value, callback) {
  if (value == 2) {
    return callback("This Device does not support Cooling Mode");
  } else if (value == 3) {
    return callback("This Device does not support Auto Mode");
  }
  let serialNumber = this.service.context['serial'];
  let dataEndpoint = (this.host + "/api/device/" + serialNumber + "/pid_state/");

  request.put(dataEndpoint, {
    'headers': {
      'Authorization': "Token " + this.config.token,
    },
    'body': {"data": value},
    'json': true
  }, (err, res, body) => {

    if (err) {
      return callback("Error Retrieving Data");
    } else if ("Error: " + res.statusCode == 401) {
      return callback("Error Retrieving Data");
    }
    callback(null);
  });
}

MaxVapor.prototype.setTargetTemperature = function (value, callback) {
  let serialNumber = this.service.context['serial'];
  let dataEndpoint = (this.host + "/api/device/" + serialNumber + "/setpoint/");
  request.put(dataEndpoint, {
    'headers': {
      'Authorization': "Token " + this.config.token,
    },
    'body': {"data": value},
    'json': true
  }, (err, res, body) => {
    if (err) {
      return callback("Error Retrieving Data");
    } else if ("Error: " + res.statusCode == 401) {
      return callback("Error Retrieving Data");
    }
    callback(null);
  });
}