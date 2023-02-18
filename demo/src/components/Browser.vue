<template>
<div v-if="fetchResource.isResolved">
  <nav>
    <label>
      Address
      <input v-model.lazy="currentUri" class="address-bar u-full-width" >
    </label>
  </nav>
  <main>
    <h1>Data</h1>
    <pre v-if="resource.isJSON">{{JSON.stringify(resource.body, null, 2)}}</pre>
    <iframe v-else ref="iframe" frameborder="0"></iframe>
  </main>
  <nav>
    <h1>Links</h1>
    <ul class="links">
      <li v-for="link in resource.links" :key="link.rel + link.uri">
        <router-link :to="{ name: 'Browser', query: {uri: link.uri} }">{{link.title || link.rel}}</router-link>
      </li>
    </ul>
    <ul v-if="fetchSchemas.isResolved" class="links">
      <li v-for="link in schemaLinks" :key="link.rel + link.targetUri">
        <router-link :to="{ name: 'Browser', query: {uri: link.targetUri} }">{{link.title || link.rel}}</router-link>
        <router-link :to="{ name: 'Browser', query: {uri: link.targetUri} }">{{link.targetUri}}</router-link>
      </li>
    </ul>
  </nav>
  <section class="forms">
    <h1>Forms</h1>
    <schema-form v-for="link in schemaForms" :key="link.rel + link.uri" :propsSchema="link.ldo.submissionSchema" @submit="submit(link, $event)" />
  </section>
  <aside>
    <h1>Meta</h1>
    <table class="meta">
      <tbody>
        <tr v-for="(info, name) in resource.meta" :key="name">
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
import SchemaForm from './SchemaForm'
import _ from 'lodash'

const client = {
  get: function(uri) {
    return fetch(uri).then(r => {
      return r.text().then(function(text) {
        const result = {
          meta: {
            statusCode: r.status

          },
          links: []
        }

        r.headers.forEach((val, name) => {
          result.meta[name] = val
        })

        const isJSON = /application\/(.+)?json/.test(r.headers.get('content-type'))

        if (isJSON) {
          result.isJSON = true
          try {
            result.body = JSON.parse(text)
          } catch (e) {
            result.isError = true
            result.body = {
              message: 'Could not parse invalid JSON.'
            }
          }
        } else {
          result.body = text
        }

        const header = r.headers.get('link')
        if (header) {
          result.links = LinkHeader.parse(header).refs
        }

        return result
      })
    })
  },
  submit: function(uri, data) {
    return fetch(uri, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(data)
    })
  }
}

export default {
  components: {
    SchemaForm
  },
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
    schemaForms() {
      if (!this.schemaLinks) return []
      return this.schemaLinks.filter(l => l.ldo.submissionSchema)
    },
    currentUri: {
      get() {
        return this.$route.query.uri
      },
      set(val) {
        this.$router.push({
          query: {
            uri: val
          }
        })
      }
    },
    absoluteUri() {
      return location.origin + this.currentUri
    }
  },
  created() {
    window.d = this
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
    'fetchResource.isResolved' (isResolved) {
      this.$nextTick(() => {
        if (isResolved && !this.resource.isJSON) {
          this.$refs.iframe.src = 'data:text/html;charset=utf-8,' + this.resource.body
        }
      })
    }
  },
  asyncMethods: {
    submit: function(link, data) {
      return client.submit(link.targetUri, data)
    },
    fetchResource: function(uri) {
      return client.get(uri).then((resource) => {
        this.fetchSchemas.execute(resource)
        return resource
      })
    },
    fetchSchemas: function(resource) {
      const descriptions = resource.links.filter(l => l.rel === 'describedBy')
      return Promise.all(descriptions.map((desc) => {
        return fetch(desc.uri).then(r => r.json())
      }))
    }
  }

}
</script>
<style scoped>
aside h1,
nav h1 {
  font-size: 30px;
  border-bottom: solid 1px #333;
}

aside,
nav {
  margin-bottom: 20px;
}

th {
  text-align: left;
  min-width: 200px;
}

td {
  width: 100%;
}

main {
  margin-bottom: 20px;
}

ul.links {
  margin-bottom: 0;
}

iframe {
  display: block;
  width: 100%;
  box-shadow: 1px 1px 5px #ccc;
}

table.meta {
  width: 100%;
}

.address-bar {
  padding: 2px 5px;
}

section.forms h1 {
  font-size: 30px;
  border-bottom: solid 1px #333;
}
</style>
