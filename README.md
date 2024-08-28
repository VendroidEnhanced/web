# VendroidEnhanced API

Small API made using Express.js to manage app updates and changelogs.

## Usage

1. Clone this repo
2. Install pnpm
3. `pnpm i`
4. Make a `config.js` file containing the following:
```js
export const config = {
    rwToken: "CHANGEME", // This token is used in API requests to update version info
    port: 3042
};
```
4. `node index.js`

## Reference

#### GET `/api/updates`

> Returns the current version number and changelog.

#### POST `/api/updates`

> **🔑 Authenticated**
>
> Sets the current version and changelog. If everything went well, returns 204. Pass the update data object as body.
>
> `{ "version": 0, "changelog": "your changelog here" }`