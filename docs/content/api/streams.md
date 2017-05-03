# Streams

Cycle provides an opinionated way of using Reactive Streams but alows a choice of the Stream library used in the `main()` function.
In addition, a choice of Stream library may be made when implementing drivers. 

`xstream` was created explicity for use with Cycle in common web frontend applications and so is the natural choice.
However, both `RxJS` and `most` Streams are fully supported in both `main` and drivers. 
Note that internally, xstream libraries are aways used to interface to the drivers.

The actual Stream library used in `main()` is defined by which stream specific version of the `run()` function is installed and imported. 
Full details may be found in the API documentation.
