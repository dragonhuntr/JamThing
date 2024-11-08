# JamThing (for Spotify CarThing)

My take on replicating the original Spotify CarThing UI, but better. Powered with Spotify's Private API.

## Features

- Minimal UI similar to the CarThing
- Listen together! Host a Jam session and share music with others in real-time
- Weather App using data from https://weather.gov

## Screenshots
![player1](https://github.com/dragonhuntr/JamThing/blob/main/images/player1.png?raw=true)
![player2](https://github.com/dragonhuntr/JamThing/blob/main/images/player2.png?raw=true)
![player3](https://github.com/dragonhuntr/JamThing/blob/main/images/player3.png?raw=true)
![jam](https://github.com/dragonhuntr/JamThing/blob/main/images/jam.png?raw=true)
![weather](https://github.com/dragonhuntr/JamThing/blob/main/images/weather.png?raw=true)


## Usage

```bash
git clone https://github.com/dragonhuntr/JamThing
npm install
```

Navigate to `/server`
```bash
cd server
```

Create a `.env` file with your Spotify login details:
```bash
USERNAME=<YOUR SPOTIFY USERNAME/EMAIL>
PASSWORD=<YOUR SPOTIFY PASSWORD>
```

Run `ws.js`
```bash
node ws.js
```

If you haven't done so already, flash your CarThing by following this [GUIDE](https://github.com/ItsRiprod/DeskThing?tab=readme-ov-file#flashing) from ItsRiprod.

Once flashing is done, run
```bash
./ct --push
```

The CarThing should reboot, and you're done! The new UI should show and automatically communicate with the server to retrieve data.

To update the weather forecast location, refer to the [API Docs](https://www.weather.gov/documentation/services-web-api) to get your gridpoint URL, then change the endpoint in `/server/weather/req.js`

The location name is also hardcoded currently, so update it in `/webapp/src/apps/Weather/WeatherApp.tsx`

## The CT script
ADB is included in this repository and can be used on its own to interact with the CarThing. However the included `ct` script will do pretty much everything you need with fewer keystrokes

The following commands work from the project root:

Create a local backup in the `backup` directory from the contents of `./webapp`
```
./ct --backup
```

Serve the webapp directory on port `8000`. You can go to `http://localhost:8000` to preview your local webapp before pushing. (ctrl-c to exit)
```
./ct --serve
```

Pull the contents of the webapp directory from the CarThing to your current working directory
```
./ct --pull
```

Push the contents of your `./webapp` directory to the CarThing
```
./ct --push
```

Open a shell to the CarThing
```
./ct --shell
```

Reboot the CarThing
```
./ct --reboot
```

## Credits
- [DeskThing](https://github.com/ItsRiprod/DeskThing) by ItsRiprod
- [Spotify-AnyThing](https://github.com/peledies/spotify-any-thing) by peledies
- [platform](https://github.com/3052/platform/tree/v1.4.9/spotify) by 3052

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/waisoon)