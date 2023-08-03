import { Inject, Injectable } from '@nestjs/common';

import { ApiPromise, WsProvider } from '@polkadot/api';
import { Hash, Header } from '@polkadot/types/interfaces';
import { MerkleTree } from 'merkletreejs';
import SHA256 from 'crypto-js/sha256';

interface BlockData {
  number: number;
  hash: string;
  header: Header;
}

interface Config {
  batchsize: number;
}

@Injectable()
export class AppService {
  private headers: BlockData[] = [];
  private trees: { root: string; tree: MerkleTree }[] = [];
  private batchSize: number;
  private api: ApiPromise = new ApiPromise();

  constructor(@Inject('CONFIG') config: Config) {
    this.batchSize = config.batchsize;
  }

  async connect(nodeUrl: string) {
    const provider = new WsProvider(nodeUrl);
    this.api = await ApiPromise.create({ provider });
    await this.listenToNewHeaders();
  }

  async listenToNewHeaders() {
    await this.api.rpc.chain.subscribeNewHeads((header) => {
      console.log(`💡 New block #${header.number} has hash ⚡️ ${header.hash}`);
      this.addHeader(header).catch(console.error);
    });
  }

  async addHeader(header: Header) {
    const hash = await this.api.rpc.chain.getBlockHash(header.number.unwrap());
    const blockData: BlockData = {
      number: header.number.unwrap().toNumber(),
      hash: hash.toString(),
      header,
    };
    this.headers.push(blockData);
    if (this.headers.length >= this.batchSize) {
      await this.addTree();
    }
  }

  async addTree() {
    const leaves = this.headers
      .splice(0, this.batchSize)
      .map((h) => SHA256(h.hash));
    const tree = new MerkleTree(leaves, SHA256);
    this.trees.push({
      root: tree.getRoot().toString(),
      tree,
    });
  }

  queryByBlockNumber(number: number): BlockData | undefined {
    return this.headers.find((h) => h.number === number);
  }

  queryByHash(hash: string): BlockData | undefined {
    return this.headers.find((h) => h.hash === hash);
  }

  generateProof(hash: string): string | undefined {
    for (const { tree } of this.trees) {
      if (tree.getLeaves().find((l) => l.toString() === hash)) {
        return tree.getProof(hash).toString();
      }
    }
  }

  verifyProof(proof: any, root: string, hash: string): boolean {
    for (const { tree } of this.trees) {
      if (tree.getRoot().toString() === root) {
        return tree.verify(proof, hash, root);
      }
    }
    return false;
  }
}

// @Injectable()
// export class AppService {
//   getHello(): string {
//     return 'Hello World!';
//   }
// }
