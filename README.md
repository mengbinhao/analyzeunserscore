#### UnserScore.js


1. Support invoked by function way

```
_.map([1,2,3], (item) => item + 1)
})
```


2. Support invoked by object way
```
_([1,2,3]).map((item) => item + 1)
})
```

### what have I learned

1. add _'s method to the prototype of _
2. no new constrctor
3. invocation chaining 
