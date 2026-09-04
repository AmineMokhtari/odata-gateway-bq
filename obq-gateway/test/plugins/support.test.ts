/*
Copyright 2026 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
import { test } from 'node:test'
import * as assert from 'node:assert'

import Fastify from 'fastify'
import Support from '../../src/plugins/support.js'

test('support works standalone', async (t) => {
  const fastify = Fastify()
  // eslint-disable-next-line no-void
  void fastify.register(Support)
  await fastify.ready()

  assert.equal(fastify.someSupport(), 'hugs')
})
