import { CancellableEvent } from './CustomEvents.js';

const SecretAuraBlockClickEventPre = new CancellableEvent();
const SecretAuraBlockClickEventPost = new CancellableEvent();

global.cryleak.secretauraclickeventpre = SecretAuraBlockClickEventPre;
global.cryleak.secretauraclickeventpost = SecretAuraBlockClickEventPost;

export { SecretAuraBlockClickEventPre, SecretAuraBlockClickEventPost };
