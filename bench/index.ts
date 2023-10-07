// Copyright (c) 2021 Cloudflare, Inc. and contributors.
// Copyright (c) 2021 Cloudflare, Inc.
// Licensed under the BSD-3-Clause license found in the LICENSE file or
// at https://opensource.org/licenses/BSD-3-Clause

import Benchmark from 'benchmark'
import { benchGroup } from './group.bench.js'
import { benchOPRF } from './oprf.bench.js'
import { Crypto, type CryptoProvider } from '../src/index.js'

import { webcrypto } from 'node:crypto'
import { CryptoSjcl } from '../src/cryptoSjcl.js'
import { CryptoNoble } from '../src/cryptoNoble.js'

if (typeof crypto === 'undefined') {
    Object.assign(global, { crypto: webcrypto })
}

async function bench(provider: CryptoProvider) {
    Crypto.provider = provider

    const bs = new Benchmark.Suite(provider.name)
    await benchOPRF(bs)
    await benchGroup(bs)

    bs.on('cycle', (ev: Benchmark.Event) => {
        console.log(provider.name, String(ev.target))
    })

    bs.run({ async: false })

    return new Promise<unknown>((resolve, reject) => {
        bs.on('error', (event: Benchmark.Event) => {
            bs.abort()
            reject(new Error(`error: ${String(event.target)}`))
        })
        bs.on('complete', resolve)
    })
}

async function runBenchmarksSerially() {
    try {
        console.log('Benchmarking CryptoNoble:')
        await bench(CryptoNoble)
        console.log('Benchmarking CryptoSjcl:')
        await bench(CryptoSjcl)
    } catch (_e) {
        const e = _e as Error
        console.log(`Error: ${e.message}`)
        console.log(`Stack: ${e.stack}`)
        process.exit(1)
    }
}

void runBenchmarksSerially()
