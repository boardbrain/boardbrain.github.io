/**
 * Öffentliche Schnittstelle des Moduls `core/shared`: gemeinsame Bausteine ohne Fachbezug
 * (Architektur 4.3, 4.6).
 */
export { assert, InvariantError } from './assert';
export { err, ok, type Err, type Ok, type Result } from './result';
