# testcafe-reporter-spec-plus

This is fork of the **Spec** reporter plugin for [TestCafe](http://devexpress.github.io/testcafe). You can:

- Filter warnings by specifying filter option in testcafe's config file `.testface.js.`:
- Log progress after each fixture. Disabled by default.

```js
module.exports = {
    ...,
    reporter: [
        {
            name: "spec-plus",
            filter: [
                "TestCafe cannot interact with the",  // Substring
                /Was unable to take a screenshot due/ // Regex also could be used
            ],
            showProgress: true // Log progress after each fixture
        },
    ]
}
```

<p align="center">
    <img src="https://raw.github.com/DevExpress/testcafe-reporter-spec/master/media/preview.png" alt="preview" />
</p>

## Install

This reporter is shipped with TestCafe by default. In most cases, you won't need to install it separately.

However, if you need to install this reporter, you can use the following command.

```sh
npm install testcafe-reporter-spec-plus
```

## Usage

When you run tests from the command line, specify the reporter name by using the `--reporter` option:

```sh
testcafe chrome 'path/to/test/file.js' --reporter spec-plus
```


When you use API, pass the reporter name to the `reporter()` method:

```js
testCafe
    .createRunner()
    .src('path/to/test/file.js')
    .browsers('chrome')
    .reporter('spec-plus') // <-
    .run();
```

## Author

Developer Express Inc. (https://devexpress.com) and [George Kiselev](https://github.com/gooddaytoday)
