/**
 * babel-plugin-transform-angular-async
 * Author: Kamil Pękala (kamilkp@gmail.com)
 */
import visitor from './visitor';

export default function () {
  return {
    visitor,
  };
};
