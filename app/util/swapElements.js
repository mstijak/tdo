export function swapElements(array, sourceIndex, targetIndex) {
  if (sourceIndex == targetIndex) return array;
  let result = [...array];
  result[sourceIndex] = array[targetIndex];
  result[targetIndex] = array[sourceIndex];
  return result;
}
