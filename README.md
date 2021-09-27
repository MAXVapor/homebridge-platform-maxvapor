<p align="center">

<img src="https://github.com/homebridge/branding/raw/master/logos/homebridge-wordmark-logo-vertical.png" width="150">

</p>
# homebridge-platform-maxvapor
A [MaxVapor E-Nail](https://maxvapor.com/) platform plugin for [Homebridge](https://github.com/nfarina/homebridge).


# Why Homebridge?

Because of the nature of our device, it is not possible to manufacture with direct support for HomeKit. Using a Homebridge installation with a plugin allows us to provide support for HomeKit without the additional limitations and approval process for certified devices.

# GUI Installation

If you are running a more recent version of Homebridge with GUI support, installing the MaxVapor Plugin is easy.

* Navigate to the "Plugins" menu of the Homebridge GUI
* Search for "maxvapor"
* Install the "Homebridge Platform Maxvapor" plugin from the search results.
* You will be asked to supply the API Token for your MaxVapor Dashboard account.

To obtain an API Token, please login to your existing MaxVapor Dashboard Account, select the `Data Logging` option from the sidebar and `Request a Token` or use one of the existing tokens displayed.

# Manual Installation

Install `homebridge-platform-maxvapor`from NPM.

Edit `~/.homebridge/config.json`, inside `"platforms": [ ... ]` add:

    {
        "token": "",
        "host": "https://dashboard.maxvapor.com",
        "platform": "MaxVaporPlugin"
    }

To obtain an API Token, please login to your existing MaxVapor Dashboard Account, select the `Data Logging` option from the sidebar and `Request a Token` or use one of the existing tokens displayed.


# HomeKit Appearance
Each MaxVapor E-Nail Controller will appear as an accessory that is a "thermostat". 

The Homebridge device name will correspond to the E-Nail Controller Name in the [Device List](https://dashboard.maxvapor.com/dashboard/devices/) of the MaxVapor Dashboard.

For example,
as shown in the [HomeDash App](https://www.homedash.app/):

<img src='01.png' width='224' height='488' />

Additional functionality may be added in the future through new services, such as the accelerometer being exposed as a "motion detector" accessory.

In addition,
the thermostat service will only respond to the `Off` and `Heat` modes, commands for `Auto` or `Cool` will be ignored by the device.

