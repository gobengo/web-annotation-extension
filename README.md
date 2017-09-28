# web-annotation-extension

Create and save [Web Annotations](https://www.w3.org/annotation/) using your favorite web browser and data-saving strategy. This extension POSTs annotations to your server so you can do whatever you want with them.

## Installation

* clone this repo
* `npm run chrome-build`
* `open chrome://extensions/` in Chrome, enable developer mode
* "Load Unpacked Extension" and select the ./build/chrome directory in here

## Options

### saveUrl

If set, you can save your web annotation to this URL via HTTP POST. Behaves like a [Web Annotation Protocol](https://www.w3.org/TR/annotation-protocol/) Client.

Sample values:

* 201 Created - http://mockbin.org/bin/fa5e1731-7544-4f05-bf73-4092b25f6dd9
* Errors
  * 400 Bad Request - http://mockbin.org/bin/96a71847-9d1f-4083-acfe-aba346257095

## Credits

* icon: [comment by Trident](https://thenounproject.com/term/comment/1215669) from the Noun Project