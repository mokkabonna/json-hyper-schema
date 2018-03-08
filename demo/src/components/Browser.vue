<template>
<div v-if="fetchResource.isResolved">
  <main>
    <h1>Data</h1>
    <pre v-if="resource.isJSON">{{JSON.stringify(resource.body, null, 2)}}</pre>
    <iframe v-else ref="iframe" frameborder="0"></iframe>
  </main>
  <nav>
    <h1>Links</h1>
    <ul>
      <li v-for="link in resource.links" :key="link.rel">
        <router-link :to="{ name: 'Browser', query: {uri: link.uri} }">{{link.title || link.rel}}</router-link>
      </li>
    </ul>
    <ul v-if="fetchSchemas.isResolved">
      <li v-for="link in schemaLinks" :key="link.rel">
        <router-link :to="{ name: 'Browser', query: {uri: link.targetUri} }">{{link.title || link.rel}}</router-link>
      </li>
    </ul>
  </nav>
  <aside>
    <h1>Meta</h1>
    <table>
      <tbody>
        <tr v-for="(info, name) in resource.meta">
          <th>
            {{name}}
          </th>
          <td>
            {{info}}
          </td>
        </tr>
      </tbody>
    </table>
  </aside>
</div>
</template>
<script>
import LinkHeader from 'http-link-header'
import hyperSchema from '../../../src/resolver'
import _ from 'lodash'

const client = {
  get: function(uri) {
    return fetch(uri).then(r => {
      return r.text().then(function(text) {
        var data
        var result = {
          meta: {
            statusCode: r.status,

          },
          links: []
        }
        
        r.headers.forEach((val, name)  => result.meta[name] = val)
        var isJSON = /application\/(.+)?json/.test(r.headers.get('content-type'))
        
        if (isJSON) {
          result.isJSON = true
          try {
            result.body = JSON.parse(text)
          } catch (e) {
            result.body = {
              message: 'Could not parse invalid JSON.'
            }
          }
        } else {
          result.body = text
        }
      

        var header = r.headers.get('link')
        if (header) {
          result.links = LinkHeader.parse(header).refs
        }

        return result
      })
    })
  }
}

export default {
  data() {
    return {
      defaultUri: '/api'
    }
  },
  computed: {
    schemaLinks() {
      if (!this.schemas) return []
      return _.flatten(this.schemas.map((schema) => {
        return hyperSchema.resolve(schema, this.resource.body, this.$route.query.uri)
      }))
    },
    currentUri() {
      return this.$route.query.uri
    }
  },
  created() {
    if (!this.$route.query.uri) {
      this.$router.replace({
        query: {
          uri: this.defaultUri
        }
      })
    }
    this.fetchResource.execute(this.$route.query.uri)
  },
  watch: {
    '$route' (route) {
      this.fetchResource.execute(route.query.uri)
    },
    'fetchResource.isResolved'() {
      this.$nextTick(()=> {
        if (!this.resource.isJSON) {
          this.$refs.frame.src = 'data:text/html;charset=utf-8,' + this.resource.body
        }
      })
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
th {
  text-align: left;
}
</style>
