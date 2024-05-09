import { Preferences } from '@capacitor/preferences';

const dbSet = async (key,value) => {
    if (typeof value !== 'string') {
        value = JSON.stringify(value)
    }
  await Preferences.set({
    key: key,
    value: value,
  });
};

const dbCheck = async (name) => {
  const v = await Preferences.get({ key: name });
  if (v == null || v.value == undefined) {
    return null
  }
  let value = v.value
  try {
    const vv = JSON.parse(value)
    value = vv
  } catch (e) {
    console.log("is string")
  }
  return value
};

const dbRemove = async (key) => {
    await Preferences.remove({ key: key });
  };

const dbKeys = async () => {
    return await Preferences.keys();
};
    
export {dbSet, dbCheck, dbRemove, dbKeys};

