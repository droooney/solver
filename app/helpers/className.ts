export function ClassName(...classes: (string | { [key: string]: any } | any[] | any)[]): string {
  let Class = '';

  classes.forEach((potentialClass) => {
    if (potentialClass == null) {
      return;
    }

    if (typeof potentialClass === 'string') {
      Class += ` ${potentialClass}`;
    } else if (Array.isArray(potentialClass)) {
      potentialClass.forEach((value) => {
        if (value && typeof value === 'string') {
          Class += ` ${value}`;
        }
      });
    } else {
      Object.entries(potentialClass).forEach(([potentialClass, value]) => {
        if (value && potentialClass) {
          Class += ` ${potentialClass}`;
        }
      });
    }
  });

  return Class.slice(1);
}
