module Validation {
    export interface IStringValidator {
        isAcceptable(s: string): boolean;
    }
}