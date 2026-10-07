/**
 * Public interface of the module `core/shared`: shared building blocks without domain logic
 * (Architecture 4.3, 4.6).
 */
export { assert, InvariantError } from './assert';
export { err, ok, type Err, type Ok, type Result } from './result';
