<a name="11.7.0"></a>
## 11.7.0 (2018-06-23)

* fix(fromEvent): Improve typings ([1d265c9](https://github.com/staltz/xstream/commit/1d265c9))



<a name="11.6.0"></a>
## 11.6.0 (2018-06-23)

* chore(package): release new version ([0cadc46](https://github.com/staltz/xstream/commit/0cadc46))
* fix(subscribe): allow partial listeners (in TypeScript) ([8bfaad7](https://github.com/staltz/xstream/commit/8bfaad7))



<a name="11.5.0"></a>
## 11.5.0 (2018-06-22)

* chore(package): release new version ([7d10c70](https://github.com/staltz/xstream/commit/7d10c70))
* fix(types): do not use arrow syntax for _start ([78272ef](https://github.com/staltz/xstream/commit/78272ef))



<a name="11.4.0"></a>
## 11.4.0 (2018-05-29)

* chore(package): release new version ([06e4267](https://github.com/staltz/xstream/commit/06e4267))
* fix(core): add xs type default export ([dff47c9](https://github.com/staltz/xstream/commit/dff47c9)), closes [#242](https://github.com/staltz/xstream/issues/242)



<a name="11.3.0"></a>
## 11.3.0 (2018-05-18)

* chore(package): gitignore pnpm shrinkwrap ([7fa8f15](https://github.com/staltz/xstream/commit/7fa8f15))
* chore(package): release new version ([1900a13](https://github.com/staltz/xstream/commit/1900a13))
* chore(package): upgrade TypeScript to 2.8 (devDependency) ([11c6385](https://github.com/staltz/xstream/commit/11c6385))
* fix(fromObservable): use Symbol.observable to get observable ([3a4271c](https://github.com/staltz/xstream/commit/3a4271c))
* fix(package): inline source maps and inline sources ([b4abefd](https://github.com/staltz/xstream/commit/b4abefd)), closes [#220](https://github.com/staltz/xstream/issues/220)
* refactor(core): enable autoimport of xs in VSCode ([d3f8df3](https://github.com/staltz/xstream/commit/d3f8df3)), closes [#242](https://github.com/staltz/xstream/issues/242)
* refactor(tests): comply with TSLint ([acbb2c5](https://github.com/staltz/xstream/commit/acbb2c5))
* test(dropRepeats): check that it completes ([328fbad](https://github.com/staltz/xstream/commit/328fbad)), closes [#246](https://github.com/staltz/xstream/issues/246)



<a name="11.2.0"></a>
## 11.2.0 (2018-01-29)

* chore(package): release new version ([6e43aa5](https://github.com/staltz/xstream/commit/6e43aa5))
* chore(symbol-observable): update to 1.2.0 ([51e62ac](https://github.com/staltz/xstream/commit/51e62ac))



<a name="11.1.0"></a>
## 11.1.0 (2017-12-12)

* chore(package): release new version ([34ecda2](https://github.com/staltz/xstream/commit/34ecda2))
* fix(package): add yarn.lock file to avoid ambiguities ([d745aa6](https://github.com/staltz/xstream/commit/d745aa6))
* fix(package): lock symbol-observable to 1.0.4 ([9de613a](https://github.com/staltz/xstream/commit/9de613a)), closes [#234](https://github.com/staltz/xstream/issues/234) [benlesh/symbol-observable#34](https://github.com/benlesh/symbol-observable/issues/34)
* docs(fromEvent): clarify that fromEvent is a factory, not an operator ([543e9b5](https://github.com/staltz/xstream/commit/543e9b5))
* docs(fromEvent): instruct about TypeScript usage and dependencies ([0eaa6a6](https://github.com/staltz/xstream/commit/0eaa6a6)), closes [#223](https://github.com/staltz/xstream/issues/223)



<a name="11.0.0"></a>
## 11.0.0 (2017-09-27)

* chore(package): release new version ([7796d10](https://github.com/staltz/xstream/commit/7796d10))
* chore(package): release new version (11 rc.1) ([ff7e05b](https://github.com/staltz/xstream/commit/ff7e05b))
* fix(delay): simplify delay (extra operator) generics ([a78ed05](https://github.com/staltz/xstream/commit/a78ed05))
* fix(extra): Simplify extra operator generics ([20e2cc3](https://github.com/staltz/xstream/commit/20e2cc3)), closes [#202](https://github.com/staltz/xstream/issues/202)
* fix(package): update TypeScript to v2.5 ([7bd9d3b](https://github.com/staltz/xstream/commit/7bd9d3b))
* fix(types): update TypeScript to v2.4.x ([65c70b8](https://github.com/staltz/xstream/commit/65c70b8))
* test(combine): Add a test to combine to prove that now it emit new Array instance on each emission ([5993998](https://github.com/staltz/xstream/commit/5993998))
* test(dropRepeats): test that type inference is better with type unification ([0972ced](https://github.com/staltz/xstream/commit/0972ced))
* docs(combine): Update combine docs removing Note about array instance ([61f364a](https://github.com/staltz/xstream/commit/61f364a))
* docs(filter): fix function signature in JSDoc ([7a6f69e](https://github.com/staltz/xstream/commit/7a6f69e)), closes [#208](https://github.com/staltz/xstream/issues/208)
* perf(dropRepeats): set equality function only once ([4bbe9a4](https://github.com/staltz/xstream/commit/4bbe9a4)), closes [#213](https://github.com/staltz/xstream/issues/213)



<a name="10.9.0"></a>
## 10.9.0 (2017-07-13)

* chore(package): release new version ([64f409a](https://github.com/staltz/xstream/commit/64f409a))
* feat(compose): support any return value for compose method ([330aaba](https://github.com/staltz/xstream/commit/330aaba)), closes [#207](https://github.com/staltz/xstream/issues/207)
* docs(readme): rebuild readme.md from markdown ([06d7f67](https://github.com/staltz/xstream/commit/06d7f67))
* Add a note about extra methods in the README ([568df0e](https://github.com/staltz/xstream/commit/568df0e))
* Fix typo in debug description ([cdad573](https://github.com/staltz/xstream/commit/cdad573))
* Remove existing reference to extras docs ([4fe9b2c](https://github.com/staltz/xstream/commit/4fe9b2c))
* refactor(tsconfig): add buffer extra to tsconfig ([b22231d](https://github.com/staltz/xstream/commit/b22231d))



<a name="10.8.0"></a>
## 10.8.0 (2017-05-12)

* chore(package): release new version ([8ee7b45](https://github.com/staltz/xstream/commit/8ee7b45))
* fix(buffer): fix semantics of buffer when source completes ([3063ae9](https://github.com/staltz/xstream/commit/3063ae9))
* refactor(buffer): update code style ([917bf82](https://github.com/staltz/xstream/commit/917bf82))
* test(buffer): adjusted intervals for input and separator streams ([3185b82](https://github.com/staltz/xstream/commit/3185b82))
* feat(extra): buffer operator that splits input stream into arrays by separator stream ([6df1974](https://github.com/staltz/xstream/commit/6df1974))
* docs(README): some hash links ([311d6f6](https://github.com/staltz/xstream/commit/311d6f6)), closes [#192](https://github.com/staltz/xstream/issues/192)



<a name="10.7.0"></a>
## 10.7.0 (2017-05-02)

* chore(package): release new version ([1a29bba](https://github.com/staltz/xstream/commit/1a29bba))
* chore(package): remove excessive files from publication ([25bbf0c](https://github.com/staltz/xstream/commit/25bbf0c)), closes [#189](https://github.com/staltz/xstream/issues/189)



<a name="10.6.0"></a>
## 10.6.0 (2017-04-27)

* chore(package): release new version ([07d197f](https://github.com/staltz/xstream/commit/07d197f))
* feat(fromPromise): widen support for promise types ([12da02d](https://github.com/staltz/xstream/commit/12da02d)), closes [#187](https://github.com/staltz/xstream/issues/187)



<a name="10.5.0"></a>
## 10.5.0 (2017-04-07)

* chore(package): release new version ([1512654](https://github.com/staltz/xstream/commit/1512654))
* feat(src): move to @types declaration files ([ff2c637](https://github.com/staltz/xstream/commit/ff2c637)), closes [#180](https://github.com/staltz/xstream/issues/180) [#176](https://github.com/staltz/xstream/issues/176)



<a name="10.4.0"></a>
## 10.4.0 (2017-04-03)

* chore(package): release new version ([f28f8b7](https://github.com/staltz/xstream/commit/f28f8b7))
* fix(map): remove operator fusion to avoid bugs ([f16e6a9](https://github.com/staltz/xstream/commit/f16e6a9)), closes [#165](https://github.com/staltz/xstream/issues/165) [#178](https://github.com/staltz/xstream/issues/178) [#165](https://github.com/staltz/xstream/issues/165) [#178](https://github.com/staltz/xstream/issues/178)



<a name="10.3.0"></a>
## 10.3.0 (2017-03-03)

* chore(package): release new version ([8f2503a](https://github.com/staltz/xstream/commit/8f2503a))
* fix(combine): do array cloning to avoid several bugs ([e8b2eef](https://github.com/staltz/xstream/commit/e8b2eef)), closes [/github.com/cyclejs/cyclejs/issues/537#issuecomment-283935639](https://github.com//github.com/cyclejs/cyclejs/issues/537/issues/issuecomment-283935639)
* perf(dist): use Google Closure Compiler instead of uglify-js ([ed6f793](https://github.com/staltz/xstream/commit/ed6f793))



<a name="10.2.0"></a>
## 10.2.0 (2017-02-03)

* chore(check-release): consider perf commits ([a080e78](https://github.com/staltz/xstream/commit/a080e78))
* chore(package): release new version ([3832be7](https://github.com/staltz/xstream/commit/3832be7))
* perf(fromObservable): avoid converting from xs stream to xs stream ([04031c6](https://github.com/staltz/xstream/commit/04031c6))
* perf(index): drop curly braces wherever possible ([26d0299](https://github.com/staltz/xstream/commit/26d0299))
* perf(Stream): speed up Stream next, error, complete handlers ([b32ffe3](https://github.com/staltz/xstream/commit/b32ffe3))
* refactor(index): shorten util function copy to cp ([e093f01](https://github.com/staltz/xstream/commit/e093f01))



<a name="10.1.0"></a>
## 10.1.0 (2017-01-31)

* chore(package.json): pin versions of devDependencies ([3996d5e](https://github.com/staltz/xstream/commit/3996d5e))
* chore(package): release new version ([289bc26](https://github.com/staltz/xstream/commit/289bc26))
* refactor(index): use TypeScript 2.1 and its Partial type ([e1ac6ad](https://github.com/staltz/xstream/commit/e1ac6ad))
* refactor(perf): remove unnecessary Highland benchmark ([302ebac](https://github.com/staltz/xstream/commit/302ebac))
* fix(flatten): fix type inference hinting ([df6d720](https://github.com/staltz/xstream/commit/df6d720))
* docs: add CONTRIBUTING.md ([a0f0dae](https://github.com/staltz/xstream/commit/a0f0dae))



<a name="9.3.0"></a>
## 9.3.0 (2016-12-22)

* chore(package): release new version ([c1cda32](https://github.com/staltz/xstream/commit/c1cda32))
* chore(package): set version to 9.2.0 as the latest 9.x ([fb1cb7f](https://github.com/staltz/xstream/commit/fb1cb7f))
* chore(perf): update perf/package.json ([c7ce5dd](https://github.com/staltz/xstream/commit/c7ce5dd))
* perf: update benchmarks ([b12065d](https://github.com/staltz/xstream/commit/b12065d))
* perf(core): improve performance by encapsulating try/catch ([31fab06](https://github.com/staltz/xstream/commit/31fab06))
* perf(core): merge together core.ts and index.ts ([a03e418](https://github.com/staltz/xstream/commit/a03e418))
* fix(take): terminate stream emission when TakeOperator recursively call itself ([3581857](https://github.com/staltz/xstream/commit/3581857)), closes [#158](https://github.com/staltz/xstream/issues/158)
* test(take): test for recursive case of take operator ([e83b7b7](https://github.com/staltz/xstream/commit/e83b7b7)), closes [#158](https://github.com/staltz/xstream/issues/158)
* refactor(core): revert to TypeScript v2.0, from v2.1 ([d408290](https://github.com/staltz/xstream/commit/d408290))
* refactor(core): shorten names of some ES6 classes ([7ee823d](https://github.com/staltz/xstream/commit/7ee823d))
* refactor(src): improve tsconfig usage of lib typings ([9390c03](https://github.com/staltz/xstream/commit/9390c03))



<a name="10.0.0"></a>
## 10.0.0 (2016-12-21)

* chore(package): release new version ([f9370cd](https://github.com/staltz/xstream/commit/f9370cd))
* fix(src): usage of TypeScript v2.1 is a breaking change ([c69327e](https://github.com/staltz/xstream/commit/c69327e))
* test(take): fix typo in test title ([c7f7db7](https://github.com/staltz/xstream/commit/c7f7db7))



<a name="9.1.0"></a>
## 9.1.0 (2016-12-12)

* chore(package): release new version ([a9854cc](https://github.com/staltz/xstream/commit/a9854cc))
* fix(fromObservable): support synchronous unsubscribe on completion ([e82b8da](https://github.com/staltz/xstream/commit/e82b8da))
* fix(src): update to TypeScript 2.1 ([b3a0cf6](https://github.com/staltz/xstream/commit/b3a0cf6))
* docs(combine): add note about recycling array instance across emissions ([7830ba9](https://github.com/staltz/xstream/commit/7830ba9))
* docs(README): remove TravisCI build status badge ([d5f1a32](https://github.com/staltz/xstream/commit/d5f1a32)), closes [#147](https://github.com/staltz/xstream/issues/147)
* docs(README): update README with combine gotchas ([f3ff581](https://github.com/staltz/xstream/commit/f3ff581))
* style(core): reorder comments in JSDoc ([4c80fed](https://github.com/staltz/xstream/commit/4c80fed))



<a name="9.0.0"></a>
## 9.0.0 (2016-11-28)

* chore(package): release new version ([747eae1](https://github.com/staltz/xstream/commit/747eae1))
* docs(README): update FAQ a bit ([f22f09c](https://github.com/staltz/xstream/commit/f22f09c))
* docs(README): updated TOC template to not generate extra newlines ([248c495](https://github.com/staltz/xstream/commit/248c495))
* fix(flattenSequentially): stop execution of interrupted inner streams ([b8d6995](https://github.com/staltz/xstream/commit/b8d6995))
* fix(stream): throw error when there are no error listeners ([e512c3e](https://github.com/staltz/xstream/commit/e512c3e)), closes [#121](https://github.com/staltz/xstream/issues/121)
* test(browser): introduce browser tests ([f7aa61c](https://github.com/staltz/xstream/commit/f7aa61c))
* test(flattenConcurrently): fix flattenConcurrently test for node.js too ([7327a9d](https://github.com/staltz/xstream/commit/7327a9d))
* test(imitate): fix test for imitate error propagation ([90ca395](https://github.com/staltz/xstream/commit/90ca395))


### BREAKING CHANGE

* ![maybe
will](https://img.shields.io/badge/will%20it%20affect%20me%3F-maybe%20will-yellow.svg)
This changes the behavior of most xstream code because errors are no
longer swallowed. When you update xstream to this version, you may
experience new errors thrown that you haven't seen before. Upgrade
carefully, keeping in mind that these thrown errors were always there,
but only now are surfaced.
* ![maybe won't](https://img.shields.io/badge/will%20it%20affect%20me%3F-maybe%20won't-yellowgreen.svg)
This is likely a breaking change for people using flattenSequentially,
specially given that xstream core was fixed so that errors are not swallowed.
Most flattenSequentially code should still work, but upgrade carefully anyway.


<a name="8.0.0"></a>
## 8.0.0 (2016-11-17)

* chore(package): make this ComVer-compliant ([1d6c923](https://github.com/staltz/xstream/commit/1d6c923))
* chore(package): release new version ([cf35f4b](https://github.com/staltz/xstream/commit/cf35f4b))
* test(flattenSequentially): add test checking stop() clean ups ([94f3bdc](https://github.com/staltz/xstream/commit/94f3bdc))
* fix(flattenSequentially): fix behaviour of outer stream completion ([fd31d49](https://github.com/staltz/xstream/commit/fd31d49)), closes [#141](https://github.com/staltz/xstream/issues/141)
* docs(README.md): update listener to only require next ([a07e5c9](https://github.com/staltz/xstream/commit/a07e5c9))



<a name="7.0.0"></a>
## 7.0.0 (2016-10-24)

* chore(package): release new version ([1a6fec0](https://github.com/staltz/xstream/commit/1a6fec0))
* refactor(FilterMap): avoid calling super method ([8980511](https://github.com/staltz/xstream/commit/8980511))
* fix(map): remove map+map fusion optimization ([1ca6a5c](https://github.com/staltz/xstream/commit/1ca6a5c)), closes [#98](https://github.com/staltz/xstream/issues/98) [#108](https://github.com/staltz/xstream/issues/108) [#93](https://github.com/staltz/xstream/issues/93) [#98](https://github.com/staltz/xstream/issues/98) [#108](https://github.com/staltz/xstream/issues/108) [#93](https://github.com/staltz/xstream/issues/93)
* fix(MemoryStream): fix a leaking execution bug ([47e67ff](https://github.com/staltz/xstream/commit/47e67ff)), closes [#53](https://github.com/staltz/xstream/issues/53)


### BREAKING CHANGE

* This change will remove map+map fusions. Your application code may or
may not rely on the bugs that map+map fusion caused, so we advise to
update carefully, testing your application code as you go. Generally
this is very straightforward and safe to update, as there are no visible
API changes.
* This is generally safe to update, but note that the behavior around
MemoryStream, startWith, take, imitate etc may have slightly changed, so
it is recommended to run tests on your application and see if it is
working, in case your application code was relying on buggy behavior.


<a name="6.6.0"></a>
## 6.6.0 (2016-10-19)

* chore(package): release new version ([1ef0019](https://github.com/staltz/xstream/commit/1ef0019))
* docs(throttle): fix example code ([cba84ca](https://github.com/staltz/xstream/commit/cba84ca))
* refactor(src): update codebase to TypeScript v2.0 ([2e41a49](https://github.com/staltz/xstream/commit/2e41a49))
* feat(Stream): accept partially defined listeners ([e9d005d](https://github.com/staltz/xstream/commit/e9d005d)), closes [#67](https://github.com/staltz/xstream/issues/67)



<a name="6.5.0"></a>
## 6.5.0 (2016-10-17)

* chore(package): release new version ([02be36f](https://github.com/staltz/xstream/commit/02be36f))
* style(META): git ignore VSCode workspace directory ([b2ddf89](https://github.com/staltz/xstream/commit/b2ddf89))
* feat(throttle): add throttle extra operator ([8b5c211](https://github.com/staltz/xstream/commit/8b5c211))
* fix(delay,dropRepeats,dropUnti,split): improve TypeScript typings with better inference ([c96ff10](https://github.com/staltz/xstream/commit/c96ff10))



<a name="6.4.1"></a>
## <small>6.4.1 (2016-09-28)</small>

* chore(package): release new version ([81db919](https://github.com/staltz/xstream/commit/81db919))
* fix(debounce): improve TypeScript typings with better inference ([7bbba73](https://github.com/staltz/xstream/commit/7bbba73))
* docs(sampleCombine): fix docs for extra operator ([28c6433](https://github.com/staltz/xstream/commit/28c6433))



<a name="6.4.0"></a>
## 6.4.0 (2016-09-25)

* chore(package): release new version ([03ce7e9](https://github.com/staltz/xstream/commit/03ce7e9))
* fix(combine): increase variadic type count to 10 ([b4fb52d](https://github.com/staltz/xstream/commit/b4fb52d))
* fix(combine): tiny fixes and perf improvements ([9090b59](https://github.com/staltz/xstream/commit/9090b59))
* fix(merge): correct typo in MergeSignature ([7a7cd64](https://github.com/staltz/xstream/commit/7a7cd64))
* fix(sampleCombine): change API to fit compose() usage ([38782d8](https://github.com/staltz/xstream/commit/38782d8))
* fix(sampleCombine): do not sample until all streams have emitted ([9882e89](https://github.com/staltz/xstream/commit/9882e89))
* style(sampleCombine): reformat with indent=2 spaces ([e21f76f](https://github.com/staltz/xstream/commit/e21f76f))
* feat(sampleCombine): add sampleCombine extra ([d3aceed](https://github.com/staltz/xstream/commit/d3aceed)), closes [staltz/xstream#102](https://github.com/staltz/xstream/issues/102)



<a name="6.3.2"></a>
## <small>6.3.2 (2016-09-21)</small>

* chore(package): release new version ([0fc6c62](https://github.com/staltz/xstream/commit/0fc6c62))
* fix(pairwise): support use of pairwise in synchronous recursive situations ([530dc25](https://github.com/staltz/xstream/commit/530dc25))



<a name="6.3.1"></a>
## <small>6.3.1 (2016-09-20)</small>

* chore(package): release new version ([3f78fe2](https://github.com/staltz/xstream/commit/3f78fe2))
* fix(merge): increase variadic type count to max 10 ([2909a78](https://github.com/staltz/xstream/commit/2909a78))



<a name="6.3.0"></a>
## 6.3.0 (2016-09-15)

* chore(package): add dependency on symbol-observable ([00601a6](https://github.com/staltz/xstream/commit/00601a6))
* chore(package): add most.js for testing purposes ([27e8e45](https://github.com/staltz/xstream/commit/27e8e45))
* chore(package): release new version ([5d46763](https://github.com/staltz/xstream/commit/5d46763))
* refactor(core): move around code related to fromObservable ([787113c](https://github.com/staltz/xstream/commit/787113c))
* test(Observable): add tests related to observable support ([727090a](https://github.com/staltz/xstream/commit/727090a))
* test(stream): add missing check for Stream.from ([e21a6ae](https://github.com/staltz/xstream/commit/e21a6ae))
* test(stream): add missing done call ([2e80834](https://github.com/staltz/xstream/commit/2e80834))
* test(stream): add subscribe tests ([d46ba75](https://github.com/staltz/xstream/commit/d46ba75))
* fix(core): fix observable producer ([0229338](https://github.com/staltz/xstream/commit/0229338))
* fix(src): create Observable type for fromInput; export from index ([42984ac](https://github.com/staltz/xstream/commit/42984ac))
* feat(core): implement basic Observable interop. ([8fe7069](https://github.com/staltz/xstream/commit/8fe7069))
* docs(README): bring back filter docs ([db526d4](https://github.com/staltz/xstream/commit/db526d4))
* docs(README): fix link to EXTRA_DOCS.md ([e1d8f52](https://github.com/staltz/xstream/commit/e1d8f52))



<a name="6.2.0"></a>
## 6.2.0 (2016-08-29)

* chore(package): release new version ([14aabec](https://github.com/staltz/xstream/commit/14aabec))
* test(filter): add test for type-guard predicate ([c1a00c7](https://github.com/staltz/xstream/commit/c1a00c7))
* feat(filter): support type guard predicates ([34e529a](https://github.com/staltz/xstream/commit/34e529a)), closes [#112](https://github.com/staltz/xstream/issues/112)
* docs(README): add gitter badge ([7a7c245](https://github.com/staltz/xstream/commit/7a7c245))
* docs(README): clarify Stream-as-a-Listener docs ([8dab267](https://github.com/staltz/xstream/commit/8dab267))



<a name="6.1.0"></a>
## 6.1.0 (2016-08-22)

* chore(package): release new version ([4a27bd5](https://github.com/staltz/xstream/commit/4a27bd5))
* refactor: use TypeScript `as` casting everywhere ([89b2039](https://github.com/staltz/xstream/commit/89b2039))
* feat(Stream): add new method setDebugListener on streams ([d0ee240](https://github.com/staltz/xstream/commit/d0ee240))
* chore(update packages in perf directory): ([58fae93](https://github.com/staltz/xstream/commit/58fae93))
* chore(use node v6 in Travis CI builds): ([968843d](https://github.com/staltz/xstream/commit/968843d))



<a name="6.0.0"></a>
## 6.0.0 (2016-08-20)

* chore(package): release new version ([c68e545](https://github.com/staltz/xstream/commit/c68e545))
* fix(core): teardown and stop producer before complete/error ([ec8d6e8](https://github.com/staltz/xstream/commit/ec8d6e8)), closes [#91](https://github.com/staltz/xstream/issues/91)


### BREAKING CHANGE

* in this version, when a stream completes or errors, its producer has already been
stopped. In previous versions, the stream first completes, propagates the complete to other
listeners and operators, and then its producer is stopped. You may barely notice this breaking
change when updating your code. Most existing code will still work like before.


<a name="5.3.6"></a>
## <small>5.3.6 (2016-08-17)</small>

* chore(package): release new version ([265cccd](https://github.com/staltz/xstream/commit/265cccd))
* fix(dropRepeats): fix usage with xs.combine ([4b3d65c](https://github.com/staltz/xstream/commit/4b3d65c)), closes [#105](https://github.com/staltz/xstream/issues/105)



<a name="5.3.5"></a>
## <small>5.3.5 (2016-08-17)</small>

* chore(package): release new version ([1b81de3](https://github.com/staltz/xstream/commit/1b81de3))
* fix(take): fix behavior for take(0) ([d965294](https://github.com/staltz/xstream/commit/d965294)), closes [#107](https://github.com/staltz/xstream/issues/107)



<a name="5.3.4"></a>
## <small>5.3.4 (2016-08-15)</small>

* chore(package): release new version ([02b9f95](https://github.com/staltz/xstream/commit/02b9f95))
* fix(flatten): do not restart inner stream if equals the previous inner ([9973eca](https://github.com/staltz/xstream/commit/9973eca)), closes [#103](https://github.com/staltz/xstream/issues/103) [#103](https://github.com/staltz/xstream/issues/103)



<a name="5.3.3"></a>
## <small>5.3.3 (2016-08-15)</small>

* chore(package): release new version ([cadf73a](https://github.com/staltz/xstream/commit/cadf73a))
* fix(dropRepeats): handle circular dependencies ([38052da](https://github.com/staltz/xstream/commit/38052da)), closes [#101](https://github.com/staltz/xstream/issues/101)



<a name="5.3.2"></a>
## <small>5.3.2 (2016-07-23)</small>

* chore(package): fix update-gh-pages to ignore when no changes ([e63d4d6](https://github.com/staltz/xstream/commit/e63d4d6))
* chore(package): release new version ([351069d](https://github.com/staltz/xstream/commit/351069d))
* chore(tools): add npm scripts check-release and release ([ba25a78](https://github.com/staltz/xstream/commit/ba25a78))
* chore(tools): fix wording of check-release reports ([1ccc232](https://github.com/staltz/xstream/commit/1ccc232))
* fix(flatten): when same inner stream, restart ([819bc94](https://github.com/staltz/xstream/commit/819bc94)), closes [#90](https://github.com/staltz/xstream/issues/90)



<a name="5.3.1"></a>
## <small>5.3.1 (2016-07-22)</small>

* chore(package): release new version ([cc1fcc4](https://github.com/staltz/xstream/commit/cc1fcc4))
* fix(debug): support usage with no argument given ([6cefc81](https://github.com/staltz/xstream/commit/6cefc81)), closes [#87](https://github.com/staltz/xstream/issues/87)



<a name="5.3.0"></a>
## 5.3.0 (2016-07-22)

* chore(package): release new version ([1adc780](https://github.com/staltz/xstream/commit/1adc780))
* feat(fromEvent): Aggregate multiple arguments ([714dd01](https://github.com/staltz/xstream/commit/714dd01)), closes [staltz/xstream#84](https://github.com/staltz/xstream/issues/84) [#89](https://github.com/staltz/xstream/issues/89)



<a name="5.2.4"></a>
## <small>5.2.4 (2016-07-20)</small>

* chore(package): release new version ([ebd4a28](https://github.com/staltz/xstream/commit/ebd4a28))
* fix(filter): consecutive filtering respects original order ([fdbd00a](https://github.com/staltz/xstream/commit/fdbd00a)), closes [#85](https://github.com/staltz/xstream/issues/85)



<a name="5.2.3"></a>
## <small>5.2.3 (2016-07-20)</small>

* chore(package): release new version ([5829bf9](https://github.com/staltz/xstream/commit/5829bf9))
* fix(merge): support union types ([5327cb0](https://github.com/staltz/xstream/commit/5327cb0)), closes [#82](https://github.com/staltz/xstream/issues/82) [staltz/xstream#80](https://github.com/staltz/xstream/issues/80)



<a name="5.2.2"></a>
## <small>5.2.2 (2016-07-19)</small>

* chore(package): release new version ([5cd05ed](https://github.com/staltz/xstream/commit/5cd05ed))
* fix(remember): bypass on MemoryStream ([34b8ddc](https://github.com/staltz/xstream/commit/34b8ddc)), closes [#83](https://github.com/staltz/xstream/issues/83)



<a name="5.2.1"></a>
## <small>5.2.1 (2016-07-12)</small>

* chore(package): release new version ([aae3c66](https://github.com/staltz/xstream/commit/aae3c66))
* refactor(core): explicit member initialization in constructor ([ffa83cd](https://github.com/staltz/xstream/commit/ffa83cd))
* refactor(core): normalize all operators out member ([d3dc267](https://github.com/staltz/xstream/commit/d3dc267))
* refactor(Stream): make _lateStop() more correct and robust ([d309c16](https://github.com/staltz/xstream/commit/d309c16))
* refactor(tests): minor cosmetic refactor of tests ([3871475](https://github.com/staltz/xstream/commit/3871475))
* test(flatten): add a test about switching to the same inner ([ca41a07](https://github.com/staltz/xstream/commit/ca41a07))
* fix(merge): fix completion and disposal ([5bbcade](https://github.com/staltz/xstream/commit/5bbcade)), closes [#76](https://github.com/staltz/xstream/issues/76)
* fix(operators): improve resistence against disposal bugs ([ff36fbd](https://github.com/staltz/xstream/commit/ff36fbd))



<a name="5.2.0"></a>
## 5.2.0 (2016-07-11)

* chore(markdown-doctest): support new fromEvent example ([234bf34](https://github.com/staltz/xstream/commit/234bf34))
* chore(package): release new version ([1ab4d35](https://github.com/staltz/xstream/commit/1ab4d35))
* feat(fromEvent): support NodeJS Event Emitters ([c203801](https://github.com/staltz/xstream/commit/c203801)), closes [#73](https://github.com/staltz/xstream/issues/73) [staltz/xstream#65](https://github.com/staltz/xstream/issues/65)



<a name="5.1.4"></a>
## <small>5.1.4 (2016-07-08)</small>

* chore(package): release new version ([c0071c6](https://github.com/staltz/xstream/commit/c0071c6))
* refactor(Stream): rearrange some methods (addListener, removeListener) ([e55da7a](https://github.com/staltz/xstream/commit/e55da7a))
* fix(MemoryStream): fix teardown of MemoryStream to forget past executions ([6bdf596](https://github.com/staltz/xstream/commit/6bdf596)), closes [#71](https://github.com/staltz/xstream/issues/71)
* docs(README): update misleading description of operators ([5f0db83](https://github.com/staltz/xstream/commit/5f0db83))



<a name="5.1.3"></a>
## <small>5.1.3 (2016-07-06)</small>

* chore(package): release new version ([3ace93b](https://github.com/staltz/xstream/commit/3ace93b))
* refactor(remember): move code around, plus tweaks ([632d9af](https://github.com/staltz/xstream/commit/632d9af))
* fix(remember): remembers also explicitly sent events ([1cdef65](https://github.com/staltz/xstream/commit/1cdef65)), closes [#69](https://github.com/staltz/xstream/issues/69)



<a name="5.1.2"></a>
## <small>5.1.2 (2016-07-06)</small>

* chore(package): release new version ([585cc1a](https://github.com/staltz/xstream/commit/585cc1a))
* fix(flatten): fix broken flatten on empty outer ([8172ffe](https://github.com/staltz/xstream/commit/8172ffe))



<a name="5.1.1"></a>
## <small>5.1.1 (2016-07-05)</small>

* chore(package): release new version ([5ff8579](https://github.com/staltz/xstream/commit/5ff8579))
* fix(flatten): fix automatic removal of inner listeners ([1c6ed5c](https://github.com/staltz/xstream/commit/1c6ed5c)), closes [#68](https://github.com/staltz/xstream/issues/68)
* fix(fromDiagram): fix support for falsey values ([85c9ca7](https://github.com/staltz/xstream/commit/85c9ca7))
* fix(imitate): fix issue #66 with imitate() ([7aa3a04](https://github.com/staltz/xstream/commit/7aa3a04)), closes [#66](https://github.com/staltz/xstream/issues/66) [#66](https://github.com/staltz/xstream/issues/66)



<a name="5.1.0"></a>
## 5.1.0 (2016-07-01)

* chore(package): release new version ([d87d229](https://github.com/staltz/xstream/commit/d87d229))
* docs(extra): add a TOC for EXTRA_DOCS.md ([367850c](https://github.com/staltz/xstream/commit/367850c))
* docs(extra): add some more ([59609ad](https://github.com/staltz/xstream/commit/59609ad))
* docs(extra): move extra docs into source files ([d9aa450](https://github.com/staltz/xstream/commit/d9aa450))
* feat(extra): add new extra factory tween() ([9ee12a7](https://github.com/staltz/xstream/commit/9ee12a7))



<a name="5.0.6"></a>
## <small>5.0.6 (2016-06-17)</small>

* chore(package): release new version ([67fb7c2](https://github.com/staltz/xstream/commit/67fb7c2))
* refactor(Stream): rename _hasCycle method to _hasNoSinks ([ed7d041](https://github.com/staltz/xstream/commit/ed7d041))
* refactor(Stream): rename _onlyReachesThis to _hasCycle ([f37ae30](https://github.com/staltz/xstream/commit/f37ae30))
* fix(imitate): fix stack overflow when pruning cycles ([02b0327](https://github.com/staltz/xstream/commit/02b0327))
* docs(README): update feature list in README ([73a2311](https://github.com/staltz/xstream/commit/73a2311))



<a name="5.0.5"></a>
## <small>5.0.5 (2016-06-14)</small>

* chore(package): release new version ([32617cb](https://github.com/staltz/xstream/commit/32617cb))
* fix(imitate): fix against cyclic propagation of errors ([1aa0549](https://github.com/staltz/xstream/commit/1aa0549))



<a name="5.0.4"></a>
## <small>5.0.4 (2016-06-14)</small>

* chore(package): release new version ([9cf6e52](https://github.com/staltz/xstream/commit/9cf6e52))
* refactor(Stream): improve _onlyReachesThis() for loop ([db89f4d](https://github.com/staltz/xstream/commit/db89f4d))
* fix(imitate): fix cyclic execution leaks ([8658aa0](https://github.com/staltz/xstream/commit/8658aa0)), closes [#51](https://github.com/staltz/xstream/issues/51)



<a name="5.0.3"></a>
## <small>5.0.3 (2016-06-13)</small>

* chore(package): release new version ([be07a01](https://github.com/staltz/xstream/commit/be07a01))
* chore(package): remove ghooks dependency ([83df51b](https://github.com/staltz/xstream/commit/83df51b))
* perf(dataflow): add dataflow perf benchmark ([9b8730a](https://github.com/staltz/xstream/commit/9b8730a))
* fix(imitate): fix imitate() isomorphism ([d9970cc](https://github.com/staltz/xstream/commit/d9970cc))
* refactor(combine): rename some internal variables ([b94bc4f](https://github.com/staltz/xstream/commit/b94bc4f))
* test(combine): add combine() test for 1 stream case ([0536caa](https://github.com/staltz/xstream/commit/0536caa))
* docs(README): tiny markdown fix to footer.md ([0cb75c4](https://github.com/staltz/xstream/commit/0cb75c4))



<a name="5.0.2"></a>
## <small>5.0.2 (2016-06-12)</small>

* chore(package): fix scripts and update devDeps ([0d29fe1](https://github.com/staltz/xstream/commit/0d29fe1))
* chore(package): release new version ([a79360f](https://github.com/staltz/xstream/commit/a79360f))
* feat(combine): change API for combine() operator ([a2aa0a6](https://github.com/staltz/xstream/commit/a2aa0a6))
* feat(imitate): move imitate() from MimicStream to Stream ([ad63372](https://github.com/staltz/xstream/commit/ad63372))
* docs(README): update README to remove createMimic ([17f0b95](https://github.com/staltz/xstream/commit/17f0b95))
* fix(imitate): fix cyclic execution leak, and refactor ([8a432b6](https://github.com/staltz/xstream/commit/8a432b6)), closes [#51](https://github.com/staltz/xstream/issues/51) [#49](https://github.com/staltz/xstream/issues/49)
* fix(take): remove redundant stop() call ([625fb3e](https://github.com/staltz/xstream/commit/625fb3e))
* test(imitate): test that imitate() does not leak ([451b713](https://github.com/staltz/xstream/commit/451b713)), closes [#51](https://github.com/staltz/xstream/issues/51)


### BREAKING CHANGE

* combine() now takes only streams as argument, no more project function. combine() will return an
stream that emits arrays of the collected values from each input stream. To transform that array,
you should now use map() operator after combine(), to take the array of collected values and return
a combination value. See tests for examples.
* MimicStream and xs.createMimic() were removed entirely. The imitate() method now exists on every
Stream instance. To use the proxy stream technique, use xs.create() to create the proxy, then call
proxy.imitate(other).


<a name="4.0.4"></a>
## <small>4.0.4 (2016-06-09)</small>

* chore(package): release new version ([bf71444](https://github.com/staltz/xstream/commit/bf71444))
* docs(imitate): improve/clarify imitate() docs ([1b7262d](https://github.com/staltz/xstream/commit/1b7262d)), closes [#44](https://github.com/staltz/xstream/issues/44)
* docs(README): move CHANGELOG out of README ([499709b](https://github.com/staltz/xstream/commit/499709b))
* refactor(doctest): Use markdown-doctest regexRequire to load extras (#48) ([5943ccb](https://github.com/staltz/xstream/commit/5943ccb)), closes [#48](https://github.com/staltz/xstream/issues/48)



<a name="4.0.3"></a>
## <small>4.0.3 (2016-06-08)</small>

* chore(package): release new version ([61bf6b1](https://github.com/staltz/xstream/commit/61bf6b1))
* fix(remember): fix remember() on producer-less streams ([cbe806d](https://github.com/staltz/xstream/commit/cbe806d))



<a name="4.0.2"></a>
## <small>4.0.2 (2016-06-08)</small>

* chore(package): release new version ([0808506](https://github.com/staltz/xstream/commit/0808506))
* fix(Stream): fix small issue with private Stream members ([61b5c12](https://github.com/staltz/xstream/commit/61b5c12))



<a name="4.0.1"></a>
## <small>4.0.1 (2016-06-03)</small>

* chore(package): release new version ([5a7f6b3](https://github.com/staltz/xstream/commit/5a7f6b3))
* fix(compose): improve compose type signature ([38b1064](https://github.com/staltz/xstream/commit/38b1064))



<a name="4.0.0"></a>
## 4.0.0 (2016-06-03)

* chore(package): release new version ([512969d](https://github.com/staltz/xstream/commit/512969d))
* docs(core): fix return docs of startWith and fold ([e383b88](https://github.com/staltz/xstream/commit/e383b88))
* fix(core): remove instance combine() and merge() ([00fc72c](https://github.com/staltz/xstream/commit/00fc72c))
* feat(core): improve signature of operators regarding types (#43) ([116e9f2](https://github.com/staltz/xstream/commit/116e9f2)), closes [#43](https://github.com/staltz/xstream/issues/43)


### BREAKING CHANGE

* debug() now returns a MemoryStream if the input was also a MemoryStream.
endWhen() now returns a MemoryStream if the input was also a MemoryStream.
fold() now returns always a MemoryStream, not Stream.
imitate() only works on conventional Stream, will throw error on
MemoryStream.
map() now returns a MemoryStream if the input was also a MemoryStream.
mapTo() now returns a MemoryStream if the input was also a MemoryStream.
replaceError() now returns a MemoryStream if the input was also a MemoryStream.
startWith() now returns always a MemoryStream, not Stream.
take() now returns a MemoryStream if the input was also a MemoryStream.
* Instance operators stream.combine() and stream.merge() removed. Use
xs.combine() and xs.merge() instead.


<a name="3.0.0"></a>
## 3.0.0 (2016-06-02)

* chore(editorconfig): add editorconfig file ([61838bb](https://github.com/staltz/xstream/commit/61838bb))
* chore(package): release new version ([a447f0c](https://github.com/staltz/xstream/commit/a447f0c))
* chore(typings): update typings to 1.0.4 ([8fdb5b8](https://github.com/staltz/xstream/commit/8fdb5b8))
* docs(extra): move extra docs to EXTRA_DOCS.md ([d6242fd](https://github.com/staltz/xstream/commit/d6242fd))
* docs(extra): write docs for flattenSequentially ([4d8b193](https://github.com/staltz/xstream/commit/4d8b193))
* docs(imitate): improve imitate() docs ([80535bd](https://github.com/staltz/xstream/commit/80535bd))
* fix(extra): change flattenSequentially and pairwise signatures ([71df158](https://github.com/staltz/xstream/commit/71df158))
* fix(extra): move flattenConcurrently from core to extra ([7d0fc01](https://github.com/staltz/xstream/commit/7d0fc01))
* fix(imitate): fix imitate, should not add listener immediately ([a6e39d2](https://github.com/staltz/xstream/commit/a6e39d2)), closes [#5](https://github.com/staltz/xstream/issues/5) [#5](https://github.com/staltz/xstream/issues/5)


### BREAKING CHANGE

* flattenConcurrently must be separately imported as an extra operator and
used with .compose()
* imitate() method on Stream removed. New type introduced: MimicStream,
which can be created through xs.createMimic(). A MimicStream has the
method imitate(), which has the same API as before, but imitate does not
trigger any Stream/Producer to start.
* Usage of flattenSequentially have changed, from
compose(flattenSequentially()) to compose(flattenSequentially) and from
compose(pairwise()) and compose(pairwise).


<a name="2.6.2"></a>
## <small>2.6.2 (2016-05-25)</small>

* chore(package): release new version ([6237147](https://github.com/staltz/xstream/commit/6237147))
* fix(debug): improve printing of objects from debug() ([9cf630b](https://github.com/staltz/xstream/commit/9cf630b)), closes [#38](https://github.com/staltz/xstream/issues/38)



<a name="2.6.1"></a>
## <small>2.6.1 (2016-05-23)</small>

* chore(package): release new version ([d6b3d7a](https://github.com/staltz/xstream/commit/d6b3d7a))
* fix(MemoryStream): fix tear down logic to reset memory ([524d68e](https://github.com/staltz/xstream/commit/524d68e)), closes [#36](https://github.com/staltz/xstream/issues/36)



<a name="2.6.0"></a>
## 2.6.0 (2016-05-21)

* chore(package): release new version ([3d37648](https://github.com/staltz/xstream/commit/3d37648))
* feat(debug): add support for label argument to debug() ([9231851](https://github.com/staltz/xstream/commit/9231851))



<a name="2.5.0"></a>
## 2.5.0 (2016-05-21)

* chore(package): release new version ([ea2a287](https://github.com/staltz/xstream/commit/ea2a287))
* feat(extra): add new extra factory fromDiagram ([d6c4ae5](https://github.com/staltz/xstream/commit/d6c4ae5))
* docs(extra): add README generation of extra operators docs ([bb16e04](https://github.com/staltz/xstream/commit/bb16e04))
* docs(README): add FAQ on withLatestFrom equivalent ([49156f7](https://github.com/staltz/xstream/commit/49156f7))



<a name="2.4.3"></a>
## <small>2.4.3 (2016-05-16)</small>

* chore(package): release new version ([664efab](https://github.com/staltz/xstream/commit/664efab))
* chore(package): update markdown-doctest dependency ([2bcd569](https://github.com/staltz/xstream/commit/2bcd569))
* perf(debounce): improve debounce speed/rate ([8bf7903](https://github.com/staltz/xstream/commit/8bf7903))
* fix(extra): add safety check against nulls for next() etc ([cf82a8b](https://github.com/staltz/xstream/commit/cf82a8b))



<a name="2.4.2"></a>
## <small>2.4.2 (2016-05-13)</small>

* chore(gitignore): add .DS_Store to .gitignore ([277a8dc](https://github.com/staltz/xstream/commit/277a8dc))
* chore(package): release new version ([9e3aea3](https://github.com/staltz/xstream/commit/9e3aea3))
* fix(flatten): fix map+flatten fusion to respect filter+map fusion ([6520550](https://github.com/staltz/xstream/commit/6520550))



<a name="2.4.1"></a>
## <small>2.4.1 (2016-05-13)</small>

* chore(package): release new version ([0aac03d](https://github.com/staltz/xstream/commit/0aac03d))
* fix(operators): add safety check against nulls for next() etc ([5d433c3](https://github.com/staltz/xstream/commit/5d433c3))
* fix(operators): improve *type* metadata for operators with fusion ([fb1e81c](https://github.com/staltz/xstream/commit/fb1e81c))
* refactor(mapTo): reuse map() operator to implement mapTo() ([7c276fb](https://github.com/staltz/xstream/commit/7c276fb))
* docs(README): fix typo (#34) ([a0c535e](https://github.com/staltz/xstream/commit/a0c535e)), closes [#34](https://github.com/staltz/xstream/issues/34)



<a name="2.4.0"></a>
## 2.4.0 (2016-05-12)

* chore(package): release new version ([8e5cb1c](https://github.com/staltz/xstream/commit/8e5cb1c))
* fix(flatten): add ins field as metadata to flatten ([cbc1f8b](https://github.com/staltz/xstream/commit/cbc1f8b))
* feat(extra): implement new extra operator: dropUntil ([e06d502](https://github.com/staltz/xstream/commit/e06d502))
* feat(extra): implement new extra operator: split ([84742e8](https://github.com/staltz/xstream/commit/84742e8))



<a name="2.3.0"></a>
## 2.3.0 (2016-05-09)

* chore(package): release new version ([2a7be24](https://github.com/staltz/xstream/commit/2a7be24))
* feat(operators): add type metadata string to all operators/producers ([a734fd4](https://github.com/staltz/xstream/commit/a734fd4))
* fix(combine): fix combine() to export its Producer class ([700a129](https://github.com/staltz/xstream/commit/700a129))



<a name="2.2.1"></a>
## <small>2.2.1 (2016-05-03)</small>

* chore(package): release new version ([144341e](https://github.com/staltz/xstream/commit/144341e))
* perf(combine): apply some perf optimizations to combine ([ee4ec4c](https://github.com/staltz/xstream/commit/ee4ec4c)), closes [#14](https://github.com/staltz/xstream/issues/14)



<a name="2.2.0"></a>
## 2.2.0 (2016-05-02)

* chore(package): release new version ([79a2aeb](https://github.com/staltz/xstream/commit/79a2aeb))
* refactor(merge): make MergeProducer code shorter ([6cc0706](https://github.com/staltz/xstream/commit/6cc0706))
* feat(combine): support zero streams args to combine() ([1b3ca90](https://github.com/staltz/xstream/commit/1b3ca90))



<a name="2.1.4"></a>
## <small>2.1.4 (2016-05-02)</small>

* chore(package): release new version ([62c656c](https://github.com/staltz/xstream/commit/62c656c))
* fix(combine): guard CombineListener against invalid out stream ([74c6061](https://github.com/staltz/xstream/commit/74c6061))
* perf(flatten): avoid cut() method in flattening ([28afee9](https://github.com/staltz/xstream/commit/28afee9))



<a name="2.1.3"></a>
## <small>2.1.3 (2016-04-30)</small>

* chore(package): release new version ([25d5d58](https://github.com/staltz/xstream/commit/25d5d58))
* refactor(MemoryStream): rename some internal members ([3f35b54](https://github.com/staltz/xstream/commit/3f35b54))
* fix(remember): return MemoryStream, not Stream ([4f50922](https://github.com/staltz/xstream/commit/4f50922)), closes [#32](https://github.com/staltz/xstream/issues/32)



<a name="2.1.2"></a>
## <small>2.1.2 (2016-04-30)</small>

* chore(package): release new version ([2286626](https://github.com/staltz/xstream/commit/2286626))
* fix(combine): fix CombineFactorySignature ([c65bd0b](https://github.com/staltz/xstream/commit/c65bd0b)), closes [#28](https://github.com/staltz/xstream/issues/28)



<a name="2.1.1"></a>
## <small>2.1.1 (2016-04-30)</small>

* chore(package): release new version ([ff76cf9](https://github.com/staltz/xstream/commit/ff76cf9))
* refactor(Stream): fix code style in _n, _e, _c methods ([ac41301](https://github.com/staltz/xstream/commit/ac41301))
* fix(remember): build safety against map+map fusion ([079602c](https://github.com/staltz/xstream/commit/079602c)), closes [#27](https://github.com/staltz/xstream/issues/27)



<a name="2.1.0"></a>
## 2.1.0 (2016-04-30)

* chore(package): release new version ([fb108cd](https://github.com/staltz/xstream/commit/fb108cd))
* fix(flatten): fix TypeScript output type ([26f2241](https://github.com/staltz/xstream/commit/26f2241)), closes [#4](https://github.com/staltz/xstream/issues/4)
* fix(flattenConcurrently): fix TypeScript output type ([b5445a5](https://github.com/staltz/xstream/commit/b5445a5)), closes [#4](https://github.com/staltz/xstream/issues/4)
* test(flatten): add TypeScript test for flattening ([c84dc18](https://github.com/staltz/xstream/commit/c84dc18)), closes [#4](https://github.com/staltz/xstream/issues/4)
* feat(create): Throw an error if for incomplete producer ([39c7c80](https://github.com/staltz/xstream/commit/39c7c80)), closes [#22](https://github.com/staltz/xstream/issues/22)



<a name="2.0.2"></a>
## <small>2.0.2 (2016-04-28)</small>

* chore(package): release new version ([ef3908e](https://github.com/staltz/xstream/commit/ef3908e))
* test(filter): add test for filter fusion ([47ca4d7](https://github.com/staltz/xstream/commit/47ca4d7))
* fix(filter): fix filter fusion logic. ([8c417f9](https://github.com/staltz/xstream/commit/8c417f9))
* perf(Stream): improve way of fixing ils array concurrency ([accd2d0](https://github.com/staltz/xstream/commit/accd2d0))



<a name="2.0.1"></a>
## <small>2.0.1 (2016-04-28)</small>

* chore(package): add update-gh-pages script, when postversion ([670a086](https://github.com/staltz/xstream/commit/670a086))
* chore(package): release new version ([089806a](https://github.com/staltz/xstream/commit/089806a))
* fix(take): fix take() behavior when stopping ([438fc0f](https://github.com/staltz/xstream/commit/438fc0f))



<a name="2.0.0"></a>
## 2.0.0 (2016-04-27)

* chore(package): add scripts to release new versions ([66a2f6a](https://github.com/staltz/xstream/commit/66a2f6a)), closes [#17](https://github.com/staltz/xstream/issues/17)
* chore(package): release new version ([1e82729](https://github.com/staltz/xstream/commit/1e82729))
* fix(package): put extra operators in xstream/extra ([2735a74](https://github.com/staltz/xstream/commit/2735a74))


### BREAKING CHANGE

* Import extra operators from xstream/extra/the-operator-you-want not from
xstream/lib/extra/the-operator-you-want


<a name="1.1.1"></a>
## <small>1.1.1 (2016-04-27)</small>

* chore(package): build v1.1.1 ([139490d](https://github.com/staltz/xstream/commit/139490d))
* chore(tests): Use done instead of undefined done.fail as error function ([bf8d38d](https://github.com/staltz/xstream/commit/bf8d38d))
* refactor(addListener): make code smaller in stream.addListener() ([c1c35b7](https://github.com/staltz/xstream/commit/c1c35b7))
* test(addListener): Add tests for addListener missing function errors ([10721b6](https://github.com/staltz/xstream/commit/10721b6))
* feat(addListener): throw an error if next, error or complete functions are missing ([b6e9df3](https://github.com/staltz/xstream/commit/b6e9df3))



<a name="1.1.0"></a>
## 1.1.0 (2016-04-26)

* chore(dist): build dist ([7fad3d3](https://github.com/staltz/xstream/commit/7fad3d3))
* chore(dist): strip comments from dist ([0e8467f](https://github.com/staltz/xstream/commit/0e8467f))
* chore(package.json): bump to 1.0.3 ([d2d0e77](https://github.com/staltz/xstream/commit/d2d0e77))
* chore(package.json): fix deployment to npm with lib folder ([497e827](https://github.com/staltz/xstream/commit/497e827))
* chore(package): build dist and bump to 1.0.8 ([a30aa01](https://github.com/staltz/xstream/commit/a30aa01))
* chore(package): build version 1.1.0 with CHANGELOG ([dc47f7b](https://github.com/staltz/xstream/commit/dc47f7b))
* chore(travis): add travis config file ([0a83370](https://github.com/staltz/xstream/commit/0a83370))
* feat(extra): implement new flattenSequentially() extra operator ([4a6e63e](https://github.com/staltz/xstream/commit/4a6e63e))
* docs(doctest): Test documentation with markdown-doctest (#10) ([694ba8a](https://github.com/staltz/xstream/commit/694ba8a)), closes [#10](https://github.com/staltz/xstream/issues/10)
* docs(README.md): add link to Cycle.js.org ([8eb6c0c](https://github.com/staltz/xstream/commit/8eb6c0c))
* docs(README): add a footer to the README ([d1782dd](https://github.com/staltz/xstream/commit/d1782dd))
* docs(README): add badge-size to README ([6ead197](https://github.com/staltz/xstream/commit/6ead197))
* docs(README): fix badge size for min-gzip ([ae5a4a2](https://github.com/staltz/xstream/commit/ae5a4a2))
* docs(README): fix doctest setup for node 0.12 ([c913569](https://github.com/staltz/xstream/commit/c913569))
* docs(README): update README with travis badge ([bc79a78](https://github.com/staltz/xstream/commit/bc79a78))
* test(tests): fix tests for node 0.12 compatibility ([9a8db39](https://github.com/staltz/xstream/commit/9a8db39))
* fix(core): export all operator classes ([10ef8f3](https://github.com/staltz/xstream/commit/10ef8f3))
* fix(package.json): add typings field, bump to 1.0.4 ([bffd84b](https://github.com/staltz/xstream/commit/bffd84b))
* fix(package): fix TS dependency on es6-promise, and bump ([4c8adb8](https://github.com/staltz/xstream/commit/4c8adb8))
* fix(typings): fix usage of ambient es6-promise ([6b4ae8e](https://github.com/staltz/xstream/commit/6b4ae8e))
* fix(typings): make es6-promise an ambient dep, and bump ([49edd74](https://github.com/staltz/xstream/commit/49edd74))



<a name="1.0.1"></a>
## <small>1.0.1 (2016-04-22)</small>

* 1.0.1 ([f32ef4b](https://github.com/staltz/xstream/commit/f32ef4b))
* Initial commit ([b8e5370](https://github.com/staltz/xstream/commit/b8e5370))
* test(factor/of): add test for xs.of() ([6298150](https://github.com/staltz/xstream/commit/6298150))
* fix(compose2): fix type signature errors ([5c77ff9](https://github.com/staltz/xstream/commit/5c77ff9))
* fix(core): fix map type signature ([133c400](https://github.com/staltz/xstream/commit/133c400))
* fix(dropRepeats): move dropRepeats from core to extra ([78851c8](https://github.com/staltz/xstream/commit/78851c8))
* fix(filterMap): properly catch errors that could be thrown ([8ff48a5](https://github.com/staltz/xstream/commit/8ff48a5))
* fix(flattenConcurrently): fix inner management when optimization is off ([da1f379](https://github.com/staltz/xstream/commit/da1f379))
* fix(fromArray): rename from() producer to fromArray() ([05f519a](https://github.com/staltz/xstream/commit/05f519a))
* fix(fromEvent): rename static domEvent() to fromEvent() as extra ([c481cc8](https://github.com/staltz/xstream/commit/c481cc8))
* fix(MemoryStream): fix how MemoryStream handles late sync emissions ([00de09d](https://github.com/staltz/xstream/commit/00de09d))
* fix(operator): add more tear down logic in _stop() in operators ([2483107](https://github.com/staltz/xstream/commit/2483107))
* fix(operator): fix all operators redirection of error/complete ([2caa2ca](https://github.com/staltz/xstream/commit/2caa2ca))
* fix(package.json): no postinstall npm script anymore ([4011aa1](https://github.com/staltz/xstream/commit/4011aa1))
* fix(periodic): rename interval() factory to periodic() ([6a2adc5](https://github.com/staltz/xstream/commit/6a2adc5))
* fix(src): make index be an import facade for core.ts ([180f7c4](https://github.com/staltz/xstream/commit/180f7c4))
* fix(Stream): fix unsubscription semantics w.r.t. restarting ([9a0f3af](https://github.com/staltz/xstream/commit/9a0f3af))
* fix(Stream): stop the producer syncly after stream completes ([faba7bf](https://github.com/staltz/xstream/commit/faba7bf))
* fix(Stream): stop the producer syncly after the Stream errors ([6c803ac](https://github.com/staltz/xstream/commit/6c803ac))
* fix(Stream): use underscore for pseudo-private fields in Stream ([95f2ebb](https://github.com/staltz/xstream/commit/95f2ebb))
* fix(take): fix take() operator, and also combine and merge ([c5fdfc0](https://github.com/staltz/xstream/commit/c5fdfc0))
* chore(.gitignore): ignore Jekyll-related folders ([a7cc8f0](https://github.com/staltz/xstream/commit/a7cc8f0))
* chore(benchmark): tiny refactor to perf benchmarks ([19651d7](https://github.com/staltz/xstream/commit/19651d7))
* chore(core): better typings for compose2() ([ce36269](https://github.com/staltz/xstream/commit/ce36269))
* chore(debounce): remove underscore and shorten variable length ([707cd50](https://github.com/staltz/xstream/commit/707cd50))
* chore(dist): build dist and fix dist script ([b99555c](https://github.com/staltz/xstream/commit/b99555c))
* chore(dist): build dist/ ([28cc2a4](https://github.com/staltz/xstream/commit/28cc2a4))
* chore(dist): build dist/ ([9536978](https://github.com/staltz/xstream/commit/9536978))
* chore(dist): merge all src files, shaves off 6kB from dist file ([6489199](https://github.com/staltz/xstream/commit/6489199))
* chore(examples): update examples to use addListener ([11c478a](https://github.com/staltz/xstream/commit/11c478a))
* chore(package.json): bump to v1.0.0 ([2244ccc](https://github.com/staltz/xstream/commit/2244ccc))
* chore(package.json): update typings dev dependency ([ade2118](https://github.com/staltz/xstream/commit/ade2118))
* chore(package): update dev deps ([4fdbdbf](https://github.com/staltz/xstream/commit/4fdbdbf))
* chore(perf): add benchmark for flatMap and switchMap ([91eb526](https://github.com/staltz/xstream/commit/91eb526))
* chore(perf): add filter-map-fusion to perf scripts ([1d9f92f](https://github.com/staltz/xstream/commit/1d9f92f))
* chore(perf): fix perf runner for xstream now with addListener ([c78b3d1](https://github.com/staltz/xstream/commit/c78b3d1))
* chore(perf): update perf test deps, and fix rxjs operators ([1326c97](https://github.com/staltz/xstream/commit/1326c97))
* chore(src): setup npm package and TypeScript source code ([6b9c54a](https://github.com/staltz/xstream/commit/6b9c54a))
* chore(tsconfig): allow for extending classes ([4125469](https://github.com/staltz/xstream/commit/4125469))
* chore(tsconfig): build extra folder with lib/ ([ab8a77e](https://github.com/staltz/xstream/commit/ab8a77e))
* chore(tsconfig): improve TypeScript workflow for some IDEs ([8b73148](https://github.com/staltz/xstream/commit/8b73148))
* chore(tsconfig): improve usage of filesGlob ([33d99c2](https://github.com/staltz/xstream/commit/33d99c2))
* docs(combine): write JSDoc for combine() operator ([9a5b8ca](https://github.com/staltz/xstream/commit/9a5b8ca))
* docs(compose): write JSDoc for compose() method ([d903b80](https://github.com/staltz/xstream/commit/d903b80))
* docs(debug): write JSDoc for debug() operator ([a8bd6c2](https://github.com/staltz/xstream/commit/a8bd6c2))
* docs(drop): write JSDoc for drop() operator ([3b687f0](https://github.com/staltz/xstream/commit/3b687f0))
* docs(empty): write JSDoc for empty() operator ([4a390e6](https://github.com/staltz/xstream/commit/4a390e6))
* docs(endWhen): write JSDoc for endWhen() operator ([759f42b](https://github.com/staltz/xstream/commit/759f42b))
* docs(examples): add map-filter-take example ([9be5477](https://github.com/staltz/xstream/commit/9be5477))
* docs(filter): write JSDoc for filter() ([f00f002](https://github.com/staltz/xstream/commit/f00f002))
* docs(flatten): write JSDoc for flatten() operator ([5b3daac](https://github.com/staltz/xstream/commit/5b3daac))
* docs(flattenConcurrently): write JSDoc for flattenConcurrenly() ([7da26af](https://github.com/staltz/xstream/commit/7da26af))
* docs(fold): write JSDoc for fold() operator ([25db830](https://github.com/staltz/xstream/commit/25db830))
* docs(from): write JSDoc for fromArray() and fromPromise() ([ce6a7ff](https://github.com/staltz/xstream/commit/ce6a7ff))
* docs(imitate): write JSDoc for imitate() method ([2c8791d](https://github.com/staltz/xstream/commit/2c8791d))
* docs(last): write JSDoc for last() operator ([3583b41](https://github.com/staltz/xstream/commit/3583b41))
* docs(merge): write JSDoc for merge() operator ([4f78a43](https://github.com/staltz/xstream/commit/4f78a43))
* docs(never): update marble diagram for never() operator ([65ce990](https://github.com/staltz/xstream/commit/65ce990))
* docs(of): write JSDoc for of() factory ([1236364](https://github.com/staltz/xstream/commit/1236364))
* docs(README): make README generation scripts, write some content ([9608925](https://github.com/staltz/xstream/commit/9608925))
* docs(README): put title ascii ([63502a9](https://github.com/staltz/xstream/commit/63502a9))
* docs(README): update minor info in README ([dcc1b98](https://github.com/staltz/xstream/commit/dcc1b98))
* docs(remember): write JSDoc for remember() operator ([e302f24](https://github.com/staltz/xstream/commit/e302f24))
* docs(replaceError): write JSDoc for replaceError() operator ([36fe204](https://github.com/staltz/xstream/commit/36fe204))
* docs(startWith): write JSDoc for startWith() operator ([30dfe44](https://github.com/staltz/xstream/commit/30dfe44))
* docs(take): write JSDoc for take() operator ([1ee92eb](https://github.com/staltz/xstream/commit/1ee92eb))
* docs(throw): write JSDoc for throw() operator ([6134217](https://github.com/staltz/xstream/commit/6134217))
* refactor(all): rename subscribe/unsubscribe -> addListener/removeListener ([c7943a9](https://github.com/staltz/xstream/commit/c7943a9))
* refactor(domEvent): remove unnecessary this.out from EventProducer ([628a6ba](https://github.com/staltz/xstream/commit/628a6ba))
* refactor(from): tiny refactor in factory/from ([d95c08c](https://github.com/staltz/xstream/commit/d95c08c))
* refactor(interval): add a name to an unnamed function ([c8c2ad1](https://github.com/staltz/xstream/commit/c8c2ad1))
* refactor(Listener): remove/rename remniscents of Observer name ([f5b2e9a](https://github.com/staltz/xstream/commit/f5b2e9a))
* refactor(Observer): rename Observer to Listener ([5452c64](https://github.com/staltz/xstream/commit/5452c64))
* refactor(operator): shorten code in operator Producer start() ([6792582](https://github.com/staltz/xstream/commit/6792582))
* refactor(operator): use special empty object instead of recreating empty objects ([27bafd0](https://github.com/staltz/xstream/commit/27bafd0))
* refactor(remember): clear Observers when a Stream ends, rename some stuff ([3762ba3](https://github.com/staltz/xstream/commit/3762ba3))
* refactor(remember): remove unnecessary code around remember() ([bae2425](https://github.com/staltz/xstream/commit/bae2425))
* refactor(src): make stuff TypeScript-private where applicable ([4514dbb](https://github.com/staltz/xstream/commit/4514dbb))
* refactor(src): merge all Proxy listeners to Operator classes ([566746a](https://github.com/staltz/xstream/commit/566746a))
* refactor(src): refactor operator Producers to be Operator type ([36f3dc5](https://github.com/staltz/xstream/commit/36f3dc5))
* refactor(src): rename all vars observer -> listener ([0788da8](https://github.com/staltz/xstream/commit/0788da8))
* refactor(src): rename Machine to Producer ([13bd699](https://github.com/staltz/xstream/commit/13bd699))
* refactor(src): use shorter names in many files ([09174f2](https://github.com/staltz/xstream/commit/09174f2))
* refactor(Stream): add teardown method, common for error() and complete() ([0f96d97](https://github.com/staltz/xstream/commit/0f96d97))
* refactor(Stream): avoid closure in xs.create() factory ([46c4782](https://github.com/staltz/xstream/commit/46c4782))
* refactor(Stream): refactor Stream factory static functions et al ([2b0fb25](https://github.com/staltz/xstream/commit/2b0fb25))
* refactor(Stream): rename a private field in Stream.ts ([ae1ee81](https://github.com/staltz/xstream/commit/ae1ee81))
* refactor(Stream): rename stream._producer to stream._prod ([ed673e2](https://github.com/staltz/xstream/commit/ed673e2))
* refactor(Stream): rename, in Stream.ts, machine=>producer ([cc59a55](https://github.com/staltz/xstream/commit/cc59a55))
* refactor(Stream): reorder methods in Stream class source code ([65ddbd4](https://github.com/staltz/xstream/commit/65ddbd4))
* refactor(Stream): tiny refactor to make a variable name shorter ([e3d8c3a](https://github.com/staltz/xstream/commit/e3d8c3a))
* refactor(tests): improve use of mocha done() function ([b3ad747](https://github.com/staltz/xstream/commit/b3ad747))
* refactor(tests): split test files into many ([724f134](https://github.com/staltz/xstream/commit/724f134))
* refactor(tsconfig): reorder some tsconfig fields ([e34ac7b](https://github.com/staltz/xstream/commit/e34ac7b))
* refactor(utils): remove dead code in utils/empty.ts ([7498032](https://github.com/staltz/xstream/commit/7498032))
* perf(core): have FilterMapOperator extend MapOperator ([e0c153a](https://github.com/staltz/xstream/commit/e0c153a))
* perf(debug): improve performance of debug() operator, using Proxy class ([9f766af](https://github.com/staltz/xstream/commit/9f766af))
* perf(filter-map-reduce): add preliminary perf micro benchmarks ([8b1f2d3](https://github.com/staltz/xstream/commit/8b1f2d3))
* perf(filter-map-reduce): improve filter-map-reduce test to actually do reduce() too ([7ff9fd0](https://github.com/staltz/xstream/commit/7ff9fd0))
* perf(fold): improve performance by using shorter names ([8a25fe7](https://github.com/staltz/xstream/commit/8a25fe7))
* perf(from): improve from factory perf by renaming a var ([a814c8a](https://github.com/staltz/xstream/commit/a814c8a))
* perf(fromArray): rename/fix from() to fromArray() in perf benchmarks ([a433dd5](https://github.com/staltz/xstream/commit/a433dd5))
* perf(merge): add merge performance benchmark ([de9f002](https://github.com/staltz/xstream/commit/de9f002))
* perf(operator): fix all operators to refer this.proxy initially to emptyObserver ([ad210fc](https://github.com/staltz/xstream/commit/ad210fc))
* perf(operator): replace operator proxies with class, improves perf ([2e6ec27](https://github.com/staltz/xstream/commit/2e6ec27))
* perf(perf): fix xstream perf benchmark for merge() ([4758a1d](https://github.com/staltz/xstream/commit/4758a1d))
* perf(scan): add performance benchmark for fold ([5d5ef94](https://github.com/staltz/xstream/commit/5d5ef94))
* perf(skip): improve skip perf by using Proxy Observer class ([5233f43](https://github.com/staltz/xstream/commit/5233f43))
* perf(Stream): improve performance of Observer methods in Stream ([465f22d](https://github.com/staltz/xstream/commit/465f22d))
* perf(Stream): remove this.num in Stream to improve perf ([53bcaad](https://github.com/staltz/xstream/commit/53bcaad))
* perf(Stream): squeeze kB size in map and filter fusion ([23ac9d0](https://github.com/staltz/xstream/commit/23ac9d0))
* perf(Stream): tiny saving of lookups and source code size ([6527129](https://github.com/staltz/xstream/commit/6527129))
* perf(take): improve take() perf by using Proxy Observer class ([6eae1a9](https://github.com/staltz/xstream/commit/6eae1a9))
* feat(concat): implement extra concat() operator ([7652011](https://github.com/staltz/xstream/commit/7652011))
* feat(core): flatten and flattenConcurrently should optimize for FilterMapOperator ([e1bebff](https://github.com/staltz/xstream/commit/e1bebff))
* feat(core): implement filter + map fusion ([b0507e6](https://github.com/staltz/xstream/commit/b0507e6))
* feat(core): use filterMap fusion for map() + filter ([a723fa4](https://github.com/staltz/xstream/commit/a723fa4))
* feat(createWithMemory): rename xs.MemoryStream to xs.createWithMemory ([c88d6c2](https://github.com/staltz/xstream/commit/c88d6c2))
* feat(debounce): implement debounce operator ([7dfb709](https://github.com/staltz/xstream/commit/7dfb709))
* feat(debounce): make debounce an extra operator ([34fd6c1](https://github.com/staltz/xstream/commit/34fd6c1))
* feat(delay): implement extra operator delay() and compose() ([48c5abc](https://github.com/staltz/xstream/commit/48c5abc))
* feat(domEvent): implement domEvent stream constructor ([ad40a08](https://github.com/staltz/xstream/commit/ad40a08))
* feat(drop): rename skip() to drop() ([cab26a9](https://github.com/staltz/xstream/commit/cab26a9))
* feat(dropRepeats): implement core instance operator dropRepeats() ([b7dccf9](https://github.com/staltz/xstream/commit/b7dccf9))
* feat(emptyObserver): makes emptyObserver noop functions instead of null ([e1d2537](https://github.com/staltz/xstream/commit/e1d2537))
* feat(endWhen): implement operator endWhen(), add tests ([23099ef](https://github.com/staltz/xstream/commit/23099ef))
* feat(factory): add factory from() with FromMachine ([e76acef](https://github.com/staltz/xstream/commit/e76acef))
* feat(factory): implement merge() with MergeProducer ([42b6f12](https://github.com/staltz/xstream/commit/42b6f12))
* feat(filterMap): implement all combinations of filter and map fusion ([5eb5822](https://github.com/staltz/xstream/commit/5eb5822))
* feat(flatten): implement flatten operator, a.k.a. switch() ([6255e53](https://github.com/staltz/xstream/commit/6255e53))
* feat(flattenConcurrently): rename flatten to flattenConcurrently ([b3a87ee](https://github.com/staltz/xstream/commit/b3a87ee))
* feat(fromPromise): implement factory fromPromise() ([ad0ccfd](https://github.com/staltz/xstream/commit/ad0ccfd))
* feat(imitate): implement imitate() operator for circular dependencies ([6545670](https://github.com/staltz/xstream/commit/6545670))
* feat(index): export new domEvent constructor ([870fdc6](https://github.com/staltz/xstream/commit/870fdc6))
* feat(MapTo): adjust to more private variables ([a5ed5ab](https://github.com/staltz/xstream/commit/a5ed5ab))
* feat(mapTo): implement mapTo ([f73bc8e](https://github.com/staltz/xstream/commit/f73bc8e))
* feat(Observer): rename complete() callback to end() ([d282684](https://github.com/staltz/xstream/commit/d282684))
* feat(operator): implement combine(), both static and instance ([f65a6a3](https://github.com/staltz/xstream/commit/f65a6a3))
* feat(operator): implement debug() operator with DebugMachine ([e2a0342](https://github.com/staltz/xstream/commit/e2a0342))
* feat(operator): implement filter operator with FilterMachine ([a74f160](https://github.com/staltz/xstream/commit/a74f160))
* feat(operator): implement flatten() operator ([4800873](https://github.com/staltz/xstream/commit/4800873))
* feat(operator): implement fold operator with FoldMachine ([57453f2](https://github.com/staltz/xstream/commit/57453f2))
* feat(operator): implement last() operator with LastMachine ([747e255](https://github.com/staltz/xstream/commit/747e255))
* feat(operator): implement map operator with MapMachine ([76df500](https://github.com/staltz/xstream/commit/76df500))
* feat(operator): implement skip operator with SkipMachine ([32dd8ac](https://github.com/staltz/xstream/commit/32dd8ac))
* feat(operator): implement take operator with TakeMachine ([6e1d0db](https://github.com/staltz/xstream/commit/6e1d0db))
* feat(pairwise): implement extra operator pairwise() ([5b1ec51](https://github.com/staltz/xstream/commit/5b1ec51))
* feat(remember): implement RememeberProducer ([7279ad8](https://github.com/staltz/xstream/commit/7279ad8))
* feat(RememberOperator): adjust to work with MemoryStream ([0898404](https://github.com/staltz/xstream/commit/0898404))
* feat(replaceError): implement replaceError(), wrap code with try-catch ([ffa5976](https://github.com/staltz/xstream/commit/ffa5976))
* feat(shamefullySendNext): introduce shamefullySendNext and hide _next callback ([552caff](https://github.com/staltz/xstream/commit/552caff))
* feat(startWith): implement startWith operator ([3489ce3](https://github.com/staltz/xstream/commit/3489ce3))
* feat(Stream): add a concept of current value ([cc5650f](https://github.com/staltz/xstream/commit/cc5650f))
* feat(Stream): add debounce to Stream prototype ([f44b819](https://github.com/staltz/xstream/commit/f44b819))
* feat(Stream): add mapTo to Stream prototype ([58c83f9](https://github.com/staltz/xstream/commit/58c83f9))
* feat(Stream): add never() and empty() stream factories ([04f59b0](https://github.com/staltz/xstream/commit/04f59b0))
* feat(Stream): implement really simply Stream and interval() factory ([a3a08e7](https://github.com/staltz/xstream/commit/a3a08e7))
* feat(Stream): implement Stream ([86d68ff](https://github.com/staltz/xstream/commit/86d68ff))
* feat(Stream): implement xs.of() ([f86fd49](https://github.com/staltz/xstream/commit/f86fd49))
* feat(takeUntil): implement and test takeUntil() ([304bed1](https://github.com/staltz/xstream/commit/304bed1))
* feat(throw): implement new static factory throw() ([76879a5](https://github.com/staltz/xstream/commit/76879a5))
* test(combine): add end-semantics tests for combine() ([afa808b](https://github.com/staltz/xstream/commit/afa808b))
* test(debounce): add debounce test ([7461cb3](https://github.com/staltz/xstream/commit/7461cb3))
* test(debounce): more explicit tests ([d12c68e](https://github.com/staltz/xstream/commit/d12c68e))
* test(domEvent): add tests for domEvent ([7cb970b](https://github.com/staltz/xstream/commit/7cb970b))
* test(empty): add test for empty() stream factory ([f27da7d](https://github.com/staltz/xstream/commit/f27da7d))
* test(factory): make empty/never test failures explicit ([cb58f7e](https://github.com/staltz/xstream/commit/cb58f7e))
* test(imitate): add more imitate() tests for Stream and MemoryStream ([19625df](https://github.com/staltz/xstream/commit/19625df))
* test(mapTo): add test for mapTo expected behavior ([9f1af1f](https://github.com/staltz/xstream/commit/9f1af1f))
* test(merge): add end-semantics tests for merge() ([0679af4](https://github.com/staltz/xstream/commit/0679af4))
* test(never): add test for never() stream factory ([a16c4cf](https://github.com/staltz/xstream/commit/a16c4cf))
* test(remember): add a test for remember() operator ([a9c5c6e](https://github.com/staltz/xstream/commit/a9c5c6e))
* test(remember): add test for rememember() ([9d15567](https://github.com/staltz/xstream/commit/9d15567))
* test(remember): add test for using memory stream like a subject ([21238e0](https://github.com/staltz/xstream/commit/21238e0))
* test(remember): fix remember tests to not use describe.only() ([8c39687](https://github.com/staltz/xstream/commit/8c39687))
* test(startWith): add test for startWith ([46ef6e7](https://github.com/staltz/xstream/commit/46ef6e7))
* test(Stream): add a few basic tests on Stream, plus refactor ([ce92a2f](https://github.com/staltz/xstream/commit/ce92a2f))
* test(Stream): add test checking imitate() and mapTo() exist ([d61c37e](https://github.com/staltz/xstream/commit/d61c37e))
* style(stream): add missing semicolon ([1b148d0](https://github.com/staltz/xstream/commit/1b148d0))
* revert(takeUntil): revert takeUntil implementation ([6f62fc1](https://github.com/staltz/xstream/commit/6f62fc1))



