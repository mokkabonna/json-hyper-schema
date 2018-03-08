There are several tasks that is not core to hyper schema itself. 

These are:

- validation
- gathering subschema
- resolving relative json pointers
- generating user interface
- http(or other protocol) communication

These tasks should be done by external libraries. They should be replaceable.