export const resolvePromises = async (promises, destructure = null) => {
  const success   = [];
  const responses = await Promise.allSettled(promises);
  const fulfills = responses.filter((item) => item.status === 'fulfilled' && item.value !== undefined);
  fulfills.forEach(({value}) => {
    if(Array.isArray(value)) return success.push(...value);
    if(destructure) return success.push(value[destructure]);

    return success.push(value);
  });
  const rejected = responses.filter((item) => item.status === 'rejected');

  return [success, rejected];
};
