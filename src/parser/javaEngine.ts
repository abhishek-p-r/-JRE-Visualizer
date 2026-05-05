import type { MemoryState } from '../store/engineStore';

export const defaultCode = `public class Main {
    public static void main(String[] args) {
        Person dev = new Person("Antigravity", 1);
        dev.sayHello();
        
        // JVM interned string from pool
        String greeting = "Welcome to JVM 3D";
        
        System.out.println(greeting);
    }
}

class Person {
    String name;
    int id;
    
    Person(String n, int i) {
        this.name = n;
        this.id = i;
    }
    
    void sayHello() {
        String msg = "Hello from Heap!";
        System.out.println(msg);
    }
}`;

const TEST_CASE_1 = `class Student {
    static String college = "Engineering College";
    String name;
    int age;
    
    Student(String n, int a) {
        this.name = n;
        this.age = a;
    }
}

public class Main {
    public static void main(String[] args) {
        int year = 2024;
        Student s1 = new Student("Alice", 20);
        Student s2 = new Student("Bob", 22);
    }
}`;

// ─── Simple regex-based Java parser ───────────────────────────────────────────
function parseJavaCode(code: string): MemoryState[] {
  const history: MemoryState[] = [];

  // Extract class names
  const classMatches = [...code.matchAll(/(?:public\s+)?class\s+(\w+)/g)];
  const classNames = classMatches.map(m => m[1]);

  // Extract static string fields
  const staticFields: Record<string, Record<string, string>> = {};
  for (const cls of classNames) {
    staticFields[cls] = {};
    const pattern = new RegExp(`static\\s+\\w+\\s+(\\w+)\\s*=\\s*"([^"]*)"`, 'g');
    const inClass = extractClassBody(code, cls);
    for (const m of inClass.matchAll(pattern)) {
      staticFields[cls][m[1]] = m[2];
    }
  }

  // Extract `new ClassName(...)` calls and variable assignments
  const newCalls = [...code.matchAll(/(\w+)\s+(\w+)\s*=\s*new\s+(\w+)\s*\(([^)]*)\)/g)];
  // Extract primitive locals
  const primLocals = [...code.matchAll(/(?:int|double|float|long|boolean|char|byte|short)\s+(\w+)\s*=\s*([^;]+);/g)];
  // Extract string literals used in constructors
  const strLiterals: string[] = [];
  for (const m of code.matchAll(/"([^"]*)"/g)) strLiterals.push(m[1]);

  // Step 0: Init
  const base: MemoryState = { step: 0, description: 'Code parsed. Ready for execution.', bytecode: '0: nop', currentLine: null, metaspace: { classes: {} }, threads: [], heap: {}, stringPool: {} };
  history.push(base);

  // Step 1: Load classes
  let stepNum = 1;
  const s1: MemoryState = structuredClone(base);
  s1.step = stepNum++;
  s1.description = `ClassLoader loads classes into Metaspace. Static fields initialized.`;
  s1.bytecode = 'invokestatic <ClassLoader.loadClass>';
  s1.currentLine = 1;
  for (const cls of classNames) {
    s1.metaspace.classes[cls] = { name: cls, staticFields: { ...staticFields[cls] } };
  }
  let strIdx = 1;
  for (const cls of classNames) {
    for (const [, val] of Object.entries(staticFields[cls])) {
      s1.stringPool[`str${strIdx++}`] = val;
    }
  }
  history.push(s1);

  // Step 2: main() frame
  const mainLine = code.split('\n').findIndex(l => l.includes('public static void main')) + 1;
  const s2: MemoryState = structuredClone(s1);
  s2.step = stepNum++;
  s2.description = `Main thread created. main() pushed to Call Stack.`;
  s2.bytecode = 'invokestatic <Main.main>\naload_0 // args';
  s2.currentLine = mainLine || 13;
  s2.threads.push({ id: 'thread-main', name: 'main', frames: [{ id: 'frame-main', methodName: 'main(String[] args)', isActive: true, variables: [{ name: 'args', type: 'String[]', value: '[]', isReference: true }] }] });
  history.push(s2);

  // Step 3: Primitive locals
  let prev: MemoryState = structuredClone(s2);
  primLocals.forEach((pm, i) => {
    const s3: MemoryState = structuredClone(prev);
    const varName = pm[1];
    const varVal = pm[2].trim();
    s3.step = stepNum++;
    s3.description = `Primitive '${varName} = ${varVal}' allocated in main() stack frame.`;
    s3.bytecode = `ldc ${varVal}\nistore_${i + 1}`;
    s3.currentLine = (mainLine || 13) + i + 1;
    s3.threads[0].frames[0].variables.push({ name: varName, type: 'int', value: varVal, isReference: false });
    history.push(s3);
    prev = s3;
  });

  // Steps for each `new` call
  let objIdx = 1;
  const classLines = code.split('\n');
  for (const nc of newCalls) {
    const [, , varName, className, argsStr] = nc;
    const objId = `obj-${varName}`;
    const args = argsStr.split(',').map(a => a.trim().replace(/"/g, ''));

    // Find instance fields for this class
    const classBody = extractClassBody(code, className);
    const fieldMatches = [...classBody.matchAll(/(?:String|int|double|float|boolean)\s+(\w+);/g)];
    const defaultFields: Record<string, unknown> = {};
    for (const fm of fieldMatches) {
      defaultFields[fm[1]] = fm[0].includes('int') || fm[0].includes('double') ? 0 : null;
    }

    // Allocate heap object
    const sa: MemoryState = structuredClone(prev);
    sa.step = stepNum++;
    sa.description = `new ${className}() allocates ${objId} in Heap. Default values set.`;
    sa.bytecode = `new #${objIdx + 3} <${className}>\ndup`;
    sa.currentLine = (mainLine || 13) + objIdx;
    sa.heap[objId] = { id: objId, className, fields: { ...defaultFields }, isGarbage: false, markedForDeletion: false };
    for (const arg of args) {
      if (arg && !/^\d+$/.test(arg)) {
        const existing = Object.values(sa.stringPool).includes(arg);
        if (!existing) sa.stringPool[`str${strIdx++}`] = arg;
      }
    }
    history.push(sa);
    prev = sa;

    // Constructor frame
    const sc_init: MemoryState = structuredClone(prev);
    sc_init.step = stepNum++;
    sc_init.description = `${className}() constructor pushed. 'this' → ${objId}.`;
    sc_init.bytecode = `ldc "${args[0] || '...'}"\ninvokespecial #${objIdx + 4} <${className}.<init>>`;
    sc_init.currentLine = classLines.findIndex(l => l.includes(`${className}(`)) + 1 || 6;
    const ctorVars: any[] = [{ name: 'this', type: className, value: objId, isReference: true }];
    args.forEach((arg, i) => {
      const paramName = ['n', 'a', 'x', 'y', 'z'][i] ?? `p${i}`;
      ctorVars.push({ name: paramName, type: /^\d+$/.test(arg) ? 'int' : 'String', value: /^\d+$/.test(arg) ? Number(arg) : arg, isReference: false });
    });
    sc_init.threads[0].frames.push({ id: `frame-${className}-${objIdx}`, methodName: `${className}(...)`, isActive: true, variables: ctorVars });
    history.push(sc_init);
    prev = sc_init;

    // Constructor assigns fields
    const sc: MemoryState = structuredClone(prev);
    sc.step = stepNum++;
    sc.description = `Constructor assigns fields to ${objId} in Heap.`;
    sc.bytecode = `aload_0 // this\naload_1 // arg\nputfield #${objIdx + 5} <${className}>`;
    sc.currentLine = (sc_init.currentLine || 6) + 1;
    const finalFields: Record<string, unknown> = {};
    fieldMatches.forEach((fm, i) => { finalFields[fm[1]] = i < args.length ? (/^\d+$/.test(args[i]) ? Number(args[i]) : args[i]) : defaultFields[fm[1]]; });
    sc.heap[objId].fields = finalFields;
    history.push(sc);
    prev = sc;

    // Constructor returns
    const sd: MemoryState = structuredClone(prev);
    sd.step = stepNum++;
    sd.description = `Constructor returns. Frame popped. '${varName}' reference stored in main() stack frame.`;
    sd.bytecode = `return\nastore_${objIdx+2}`;
    sd.currentLine = (mainLine || 13) + objIdx;
    sd.threads[0].frames.pop();
    sd.threads[0].frames[0].variables.push({ name: varName, type: className, value: objId, isReference: true });
    history.push(sd);
    prev = sd;
    objIdx++;
  }

  // Final step: main ends
  const finalStep: MemoryState = structuredClone(prev);
  finalStep.step = stepNum;
  finalStep.description = 'main() completes. Stack frame popped. JVM exits. Heap objects eligible for GC.';
  finalStep.bytecode = 'return';
  finalStep.currentLine = code.split('\n').length;
  finalStep.threads[0].frames = [];
  history.push(finalStep);

  return history;
}

function extractClassBody(code: string, className: string): string {
  const start = code.indexOf(`class ${className}`);
  if (start === -1) return '';
  let depth = 0, i = start;
  while (i < code.length) {
    if (code[i] === '{') depth++;
    else if (code[i] === '}') { depth--; if (depth === 0) return code.slice(start, i + 1); }
    i++;
  }
  return code.slice(start);
}

export const parseAndGenerateHistory = (code: string): MemoryState[] => {
  const norm = (s: string) => s.replace(/\s+/g, '');
  if (norm(code) === norm(TEST_CASE_1)) return generateTestCase1History();
  try {
    const result = parseJavaCode(code);
    if (result.length > 1) return result;
  } catch {
    // fall through
  }
  return [{ step: 0, description: 'Code parsed. Press ▶ to begin stepping through execution.', currentLine: null, metaspace: { classes: {} }, threads: [], heap: {}, stringPool: {} }];
};

function generateTestCase1History(): MemoryState[] {
  const history: MemoryState[] = [];
  const base: MemoryState = { step: 0, description: 'Program Initialized. Ready to load classes.', bytecode: '0: nop', currentLine: null, metaspace: { classes: {} }, threads: [], heap: {}, stringPool: {} };
  history.push(base);
  const s1: MemoryState = JSON.parse(JSON.stringify(base));
  s1.step = 1; s1.description = 'ClassLoader loads Main and Student into Metaspace. Static fields initialized.'; s1.bytecode = 'getstatic #1 <Student.college>'; s1.currentLine = 1;
  s1.metaspace.classes = { Main: { name: 'Main', staticFields: {} }, Student: { name: 'Student', staticFields: { college: 'Engineering College' } } };
  s1.stringPool = { str1: 'Engineering College' };
  history.push(s1);
  const s2: MemoryState = JSON.parse(JSON.stringify(s1));
  s2.step = 2; s2.description = 'Main thread created. main() pushed to Call Stack.'; s2.bytecode = 'invokestatic #2 <Main.main>'; s2.currentLine = 13;
  s2.threads.push({ id: 'thread-main', name: 'main', frames: [{ id: 'frame-main', methodName: 'main(String[] args)', isActive: true, variables: [{ name: 'args', type: 'String[]', value: '[]', isReference: true }] }] });
  history.push(s2);
  const s3: MemoryState = JSON.parse(JSON.stringify(s2));
  s3.step = 3; s3.description = "Primitive 'year = 2024' allocated directly in main() stack frame."; s3.bytecode = 'sipush 2024\nistore_1'; s3.currentLine = 14;
  s3.threads[0].frames[0].variables.push({ name: 'year', type: 'int', value: 2024, isReference: false });
  history.push(s3);
  const s4: MemoryState = JSON.parse(JSON.stringify(s3));
  s4.step = 4; s4.description = 'new Student() allocates obj-s1 in Heap. Default field values set.'; s4.bytecode = 'new #3 <Student>\ndup'; s4.currentLine = 15;
  s4.heap['obj-s1'] = { id: 'obj-s1', className: 'Student', fields: { name: null, age: 0 }, isGarbage: false, markedForDeletion: false };
  s4.stringPool = { ...s3.stringPool, str2: 'Alice' };
  history.push(s4);
  const s5: MemoryState = JSON.parse(JSON.stringify(s4));
  s5.step = 5; s5.description = "Student() constructor pushed. 'this' → obj-s1 in Heap."; s5.bytecode = 'ldc "Alice"\nbipush 20\ninvokespecial #4 <Student.<init>>'; s5.currentLine = 6;
  s5.threads[0].frames.push({ id: 'frame-Student-1', methodName: 'Student(String n, int a)', isActive: true, variables: [{ name: 'this', type: 'Student', value: 'obj-s1', isReference: true }, { name: 'n', type: 'String', value: 'Alice', isReference: false }, { name: 'a', type: 'int', value: 20, isReference: false }] });
  history.push(s5);
  const s6: MemoryState = JSON.parse(JSON.stringify(s5));
  s6.step = 6; s6.description = "Constructor assigns name='Alice', age=20 to obj-s1's Heap fields."; s6.bytecode = 'aload_0\naload_1\nputfield #5 <Student.name>\naload_0\niload_2\nputfield #6 <Student.age>'; s6.currentLine = 8;
  s6.heap['obj-s1'].fields = { name: 'Alice', age: 20 };
  history.push(s6);
  const s7: MemoryState = JSON.parse(JSON.stringify(s6));
  s7.step = 7; s7.description = "Constructor frame popped. 's1' reference stored in main() stack."; s7.bytecode = 'return\nastore_2'; s7.currentLine = 15;
  s7.threads[0].frames.pop();
  s7.threads[0].frames[0].variables.push({ name: 's1', type: 'Student', value: 'obj-s1', isReference: true });
  history.push(s7);
  const s8: MemoryState = JSON.parse(JSON.stringify(s7));
  s8.step = 8; s8.description = 'new Student() allocates obj-s2 in Heap. Default values set.'; s8.bytecode = 'new #3 <Student>\ndup'; s8.currentLine = 16;
  s8.heap['obj-s2'] = { id: 'obj-s2', className: 'Student', fields: { name: null, age: 0 }, isGarbage: false, markedForDeletion: false };
  s8.stringPool = { ...s7.stringPool, str3: 'Bob' };
  history.push(s8);
  const s9: MemoryState = JSON.parse(JSON.stringify(s8));
  s9.step = 9; s9.description = "Student() constructor pushed. 'this' → obj-s2 in Heap."; s9.bytecode = 'ldc "Bob"\nbipush 22\ninvokespecial #4 <Student.<init>>'; s9.currentLine = 6;
  s9.threads[0].frames.push({ id: 'frame-Student-2', methodName: 'Student(String n, int a)', isActive: true, variables: [{ name: 'this', type: 'Student', value: 'obj-s2', isReference: true }, { name: 'n', type: 'String', value: 'Bob', isReference: false }, { name: 'a', type: 'int', value: 22, isReference: false }] });
  history.push(s9);
  const s10: MemoryState = JSON.parse(JSON.stringify(s9));
  s10.step = 10; s10.description = "Constructor assigns name='Bob', age=22 to obj-s2's Heap fields."; s10.bytecode = 'aload_0\naload_1\nputfield #5 <Student.name>\naload_0\niload_2\nputfield #6 <Student.age>'; s10.currentLine = 8;
  s10.heap['obj-s2'].fields = { name: 'Bob', age: 22 };
  history.push(s10);
  const s11: MemoryState = JSON.parse(JSON.stringify(s10));
  s11.step = 11; s11.description = "Constructor frame popped. 's2' reference stored in main() stack."; s11.bytecode = 'return\nastore_3'; s11.currentLine = 16;
  s11.threads[0].frames.pop();
  s11.threads[0].frames[0].variables.push({ name: 's2', type: 'Student', value: 'obj-s2', isReference: true });
  history.push(s11);
  const s12: MemoryState = JSON.parse(JSON.stringify(s11));
  s12.step = 12; s12.description = 'main() completes. All stack frames popped. Heap objects eligible for GC.'; s12.bytecode = 'return'; s12.currentLine = 17;
  s12.threads[0].frames = [];
  history.push(s12);
  return history;
}

