/**
 * Determines whether a given value is a Prisma-related error.
 *
 * Prisma errors (such as initialization, validation, or query engine errors)
 * typically expose a `code` property that identifies the specific issue.
 * This helper safely checks the error shape without assuming it is an `Error`
 * instance, allowing TypeScript to properly narrow the type when the check passes.
 *
 * @param err - The unknown value thrown during execution.
 *
 * @returns `true` if the value resembles a Prisma error (i.e., an object
 *          containing a `code` property), otherwise `false`.
 *
 * @example
 * ```ts
 * try {
 *   await prisma.user.findMany();
 * } catch (err) {
 *   if (isPrismaError(err)) {
 *     console.log('Prisma error code:', err.code);
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * isPrismaError(new Error('Something failed'));  // false
 *
 * const prismaErr = { code: 'P2002', message: 'Unique constraint failed' };
 * isPrismaError(prismaErr); // true
 * ```
 */
export function isPrismaError(err: unknown): err is { code: string } {
  return typeof err === 'object' && err !== null && 'code' in err;
}
