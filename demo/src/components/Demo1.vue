<template>
<div v-if="fetchResource.isResolved">
  <main>
    <h1>Data</h1>
    <pre>{{resource.body}}</pre>
  </main>
  <nav>
    <h1>Links</h1>
    <ul>
      <li v-for="link in resource.links" :key="link.rel">
        <router-link :to="{ name: 'Demo1', query: {uri: link.uri} }">{{link.title || link.rel}}</router-link>
      </li>
    </ul>
    <ul v-if="fetchSchemas.isResolved">
      <li v-for="link in schemaLinks" :key="link.rel">
        <router-link :to="{ name: 'Demo1', query: {uri: link.targetUri} }">{{link.title || link.rel}}</router-link>
      </li>
    </ul>
  </nav>
</div>
</template>
<script>
import LinkHeader from 'http-link-header'
import hyperSchema from '../../../src/resolver'
import _ from 'lodash'

const client = {
  get: function(uri) {
    return fetch(uri).then(r => {
      return r.json().then(function(data) {
        var result = {
          body: data,
          links: []
        }

        var header = r.headers.get('link')
        if (header) {
          result.links = LinkHeader.parse(header).refs
        }
        console.log(result)

        return result
      })
    })
  }
}

export default {
  props: {
    uri: {
      type: String,
      default: '/api'
    }
  },
  data() {
    window.d = this
    return {

    }
  },
  computed: {
    schemaLinks() {
      if (!this.schemas) return []
      return _.flatten(this.schemas.map((schema) => {
        return hyperSchema.resolve(schema, this.resource.body, this.$route.query.uri)
      }))
    }
  },
  created() {
    this.fetchResource.execute(this.$route.query.uri)
  },
  watch: {
    '$route' (route) {
      this.fetchResource.execute(route.query.uri)
    }
  },
  asyncMethods: {
    fetchResource: function(uri) {
      return client.get(uri).then((resource) => {
        this.fetchSchemas.execute(resource)
        return resource
      })
    },
    fetchSchemas: function(resource) {
      var descriptions = resource.links.filter(l => l.rel === 'describedBy')
      return Promise.all(descriptions.map((desc) => {
        return fetch(desc.uri).then(r => r.json())
      }))
    }
  }

}
</script>
<style scoped>
</style>
