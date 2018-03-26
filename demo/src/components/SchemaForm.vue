<template lang="html">
<form v-if="$schema && !$schema.then" class="schema-form" @submit.prevent="submit">
  <h1>{{propsSchema.title}}</h1>
  <textarea :value="schemaAsText" class="schema-content" @change="tryParseJSON"></textarea>
  <div v-if="!hasValidJSON">Invalid JSON</div>
  <div v-if="$v.$error">
    Invalid schema
  </div>
  <button type="submit">Submit</button>
</form>
</template>
<script>
var res
var prom = new Promise(function(resolve) {
  res = resolve
})
export default {
  props: {
    propsSchema: {
      type: Object
    }
  },
  schema: prom,
  data() {
    window.d = this
    return {
      hasValidJSON: true
    }
  },
  computed: {
    schemaAsText() {
      return JSON.stringify(this.schema, null, 2)
    }
  },
  created() {
    this.$watch('propsSchema', function(schema) {
      res(schema)
    }, {
      immediate: true
    })
  },
  watch: {
    schemaAsText(text) {
      if (this.hasValidJSON) {
        this.schema = JSON.parse(text)
      }
    }
  },
  methods: {
    tryParseJSON(e) {
      try {
        this.schema = JSON.parse(e.target.value)
        this.hasValidJSON = true
      } catch (err) {
        this.hasValidJSON = false
      }
    }
  },
  asyncMethods: {
    submit() {
      if (this.$v.$invalid) {
        this.$v.$touch()
      } else {
        this.$emit('submit', this.schema)
      }
    }
  }
}
</script>

<style lang="css">
.schema-form {
  padding: 20px;
}

.schema-form h1 {
  font-size: 18px;
}

.schema-content {
  width: 100%;
  height: 150px;
}
</style>
