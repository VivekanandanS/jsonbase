# Key Value Store 

Read any huge file , supports more the node's heap size

Update : Caching will be added in next update , to reduce read operation on disk

## Installation

Install package directly fom npm ,

```shell
npm install jsonbase-store
```

#### Intialize store

Either specify file path or new file will be created in current working directory

```js
var store = require('jsonbase-store')('./db');
```


#### Insert

```js
await store.insert("1", { 'key' : 'value' },1000);
```


#### Update

```js
await store.update("1", { 'key' : 'value' });
```


#### Select

```js
await store.update("1");
```


#### Delete

```js
await store.update("1");
```

