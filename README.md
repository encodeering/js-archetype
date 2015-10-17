# JS Archetype

## How to create an empty project setup?

Download a zipped archive using the following commands (curl should be available on the windows gitbash as well)

```
COMMITMENT=master
curl -sL https://github.com/encodeering/js-archetype/archive/$COMMITMENT.zip -o $COMMITMENT.zip && unzip $COMMITMENT.zip && rm unzip $COMMITMENT.zip
```

## Properties

### ```--report```      : boolean (false)
* indicates that the reporting output should be redirected to a file instead of stdout

### ```--coverage```    : boolean (false)
* indicates that coverage reports should be generated additionally

### ```--incremental``` : boolean (false)
* indicates that only modified files should be processed (e.g. linting)

### ```--production```  : boolean (false)
* indicates that minification should be activated. currently only working for es5 builds

### ```--js-language``` : enum {es5|es6} (es6)
* specifies the target runtime to a specific ecma version. transpilation will be activated for es5 using babel

### ```--js-platform``` : enum {browser|node} (node)
* specifies the target runtime platform. transpilation will be activated for browser using browserify

## Gulp

### ```gulp config```

* displays the current property configuration

### ```gulp clean```

* deletes all intermediate files from ```lib``` and ```target```
* deletes all files from internally used caches

### ```gulp lint```

* performs a linting of all javascript files from ```src``` and ```test```using eslint with the rules defined in ```.eslintrc``` and exclusion defined in ```.eslintignore```

### ```gulp test```

* performs a validation of all javascript specifications from ```test``` using mocha and istanbul (```--coverage```)

### ```gulp watch```

* watches for file modifications of all javascript files from ```src``` and ```test```
* synchronizes the caches

### ```gulp package```

* builds the package in ```target``` using the specified ```--js-language``` and ```--js-platform``` configuration, which may also include a minification step (```--production```)

### ```gulp distribution```

* builds a distribution and moves all related files to ```lib```

## NPM

### ```npm clean```

* runs ```gulp clean```

### ```npm test```

* runs ```gulp lint test```

### ```npm watch```

* runs ```gulp watch```

### ```npm watch+```

* runs ```gulp watch --incremental```

### ```npm prepublish```

* runs ```gulp clean && gulp distribution --production --js-language es6```
* an explanation can by found [here](https://medium.com/greenkeeper-blog/what-is-npm-s-prepublish-and-why-is-it-so-confusing-a948373e6be1)
