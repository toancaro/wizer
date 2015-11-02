# [wizer](https://github.com/nntoanbkit/wizer)

wizer is a powerful front-end JavaScript library for faster and easier AngularJS and SharePoint base web development.

## Table of contents

* [Quick start](#quick-start)
* [Installation](#installation)

## Quick start

Several quick start options are available:

* [Documentation](https://github.com/nntoanbkit/wizer/blob/master/docs/SPList.md)

## Installation

* Download [development unminified version](https://rawgit.com/nntoanbkit/wizer/master/dist/wizer.js) or [production minified version](https://rawgit.com/nntoanbkit/wizer/master/dist/wizer.min.js)
* Add these scripts to your `index.html`

````html
<!-- wizer depends on lodash, jQuery and AngularJS -->
<script src="path/to/lodash.min.js"></script>
<script src="path/to/jQuery.min.js"></script>
<script src="path/to/angular.min.js"></script>

<!-- Choose one of these files -->
<script src="path/to/wizer.js"></script>
<!-- or -->
<script src="path/to/wizer.min.js"></script>
````

* Make your Angular module depend on `wizer` module

````javascript
angular.module("your-app", ["wizer"]);
````
