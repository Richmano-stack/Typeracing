import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

const passages = [
    // --- EASY (Short, common words, minimal punctuation) ---
    { content: "The quick brown fox jumps over the lazy dog.", difficulty: "EASY", source: "Typography" },
    { content: "Practice makes perfect. Consistency in typing helps improve accuracy.", difficulty: "EASY", source: "Educational" },
    { content: "Welcome to the typing race! Your fingers dance across the keyboard.", difficulty: "EASY", source: "Game Intro" },
    { content: "Coding is a superpower that allows you to build anything.", difficulty: "EASY", source: "Motivation" },
    { content: "Check your posture and keep your wrists straight while typing.", difficulty: "EASY", source: "Health" },
    { content: "Press the space bar with your thumb for maximum efficiency.", difficulty: "EASY", source: "Tips" },
    { content: "Digital worlds are built with logic and creative vision.", difficulty: "EASY", source: "Cyber" },
    { content: "Focus on the screen and let your muscle memory take over.", difficulty: "EASY", source: "Training" },
    { content: "A steady rhythm is better than a burst of speed.", difficulty: "EASY", source: "Strategy" },
    { content: "Cybersecurity starts with a strong and unique password.", difficulty: "EASY", source: "Security" },
    { content: "The cloud is just someone else's computer in a data center.", difficulty: "EASY", source: "Tech Truths" },
    { content: "Learning to code is like learning a new spoken language.", difficulty: "EASY", source: "Education" },
    { content: "Keep your eyes on the text and do not look at your hands.", difficulty: "EASY", source: "Pro Tips" },
    { content: "Small steps every day lead to big results over time.", difficulty: "EASY", source: "Motivation" },
    { content: "The internet connects billions of people across the globe.", difficulty: "EASY", source: "Networking" },
    { content: "Simple code is often better than complex solutions.", difficulty: "EASY", source: "Philosophy" },
    { content: "Type with all ten fingers to reach your true potential.", difficulty: "EASY", source: "Training" },
    { content: "Web browsers translate code into visual experiences.", difficulty: "EASY", source: "Web Dev" },
    { content: "Data is the new oil in the modern digital economy.", difficulty: "EASY", source: "Finance" },
    { content: "Your keyboard is the bridge between your mind and the machine.", difficulty: "EASY", source: "Cyber" },
    { content: "Success is the sum of small efforts repeated daily.", difficulty: "EASY", source: "Motivation" },
    { content: "Always save your work before closing the editor.", difficulty: "EASY", source: "Best Practice" },
    { content: "Debugging is like being a detective in a crime movie.", difficulty: "EASY", source: "Humor" },
    { content: "The best way to predict the future is to invent it.", difficulty: "EASY", source: "Vision" },
    { content: "Hardware is the part of a computer you can kick.", difficulty: "EASY", source: "Humor" },
    { content: "Every great developer was once a total beginner.", difficulty: "EASY", source: "Motivation" },
    { content: "Open source software allows everyone to contribute.", difficulty: "EASY", source: "Community" },
    { content: "Binary code consists of only zeros and ones.", difficulty: "EASY", source: "Science" },
    { content: "A pixel is the smallest unit of a digital image.", difficulty: "EASY", source: "Graphics" },
    { content: "Stay curious and never stop learning new things.", difficulty: "EASY", source: "Life" },
    { content: "Speed will come naturally once you master accuracy.", difficulty: "EASY", source: "Pro Tips" },
    { content: "Information wants to be free but data wants to be safe.", difficulty: "EASY", source: "Cyber" },
    { content: "A clean workspace leads to a clean and focused mind.", difficulty: "EASY", source: "Productivity" },

    // --- MEDIUM (Technical terms, punctuation, mixed casing) ---
    { content: "JavaScript revolutionized web development by enabling interactive experiences.", difficulty: "MEDIUM", source: "Tech" },
    { content: "Algorithms and data structures form the foundation of computer science.", difficulty: "MEDIUM", source: "Tech" },
    { content: "Maintaining proper posture during typing reduces fatigue and physical strain.", difficulty: "MEDIUM", source: "Health" },
    { content: "React components use hooks like useEffect to manage side effects efficiently.", difficulty: "MEDIUM", source: "React" },
    { content: "The terminal is a powerful tool for developers to interact with the OS.", difficulty: "MEDIUM", source: "DevOps" },
    { content: "Encryption ensures that private data remains unreadable to unauthorized users.", difficulty: "MEDIUM", source: "Security" },
    { content: "Database indexing significantly improves the speed of data retrieval operations.", difficulty: "MEDIUM", source: "Backend" },
    { content: "Responsive design ensures that websites look great on all screen sizes.", difficulty: "MEDIUM", source: "UI/UX" },
    { content: "Continuous Integration and Deployment (CI/CD) automates the shipping process.", difficulty: "MEDIUM", source: "DevOps" },
    { content: "Functional programming emphasizes the use of pure functions and immutability.", difficulty: "MEDIUM", source: "Computer Science" },
    { content: "Version control systems like Git allow teams to collaborate on codebases.", difficulty: "MEDIUM", source: "Workflow" },
    { content: "The DOM represents the structure of a web page as a branching tree.", difficulty: "MEDIUM", source: "Frontend" },
    { content: "Asynchronous programming prevents the UI from freezing during long tasks.", difficulty: "MEDIUM", source: "Logic" },
    { content: "Docker containers wrap software in a complete filesystem for portability.", difficulty: "MEDIUM", source: "Infrastructure" },
    { content: "Restful APIs use standard HTTP methods like GET, POST, PUT, and DELETE.", difficulty: "MEDIUM", source: "API Design" },
    { content: "Type safety in TypeScript catches errors during development rather than runtime.", difficulty: "MEDIUM", source: "TypeScript" },
    { content: "User experience design focuses on the meaningful interaction with products.", difficulty: "MEDIUM", source: "Design" },
    { content: "Server-side rendering can improve initial page load times and SEO performance.", difficulty: "MEDIUM", source: "Next.js" },
    { content: "A firewall monitors and controls incoming and outgoing network traffic.", difficulty: "MEDIUM", source: "Networking" },
    { content: "Machine learning models require large datasets to improve their accuracy.", difficulty: "MEDIUM", source: "AI" },
    { content: "Recursion is a method where the solution to a problem depends on smaller instances.", difficulty: "MEDIUM", source: "Math" },
    { content: "Cascading Style Sheets (CSS) define the visual layout of a web document.", difficulty: "MEDIUM", source: "Web" },
    { content: "SQL is a domain-specific language used for managing relational databases.", difficulty: "MEDIUM", source: "Data" },
    { content: "Markdown is a lightweight markup language with plain-text formatting syntax.", difficulty: "MEDIUM", source: "Writing" },
    { content: "The 'this' keyword in JavaScript behaves differently depending on the context.", difficulty: "MEDIUM", source: "JS Core" },
    { content: "Object-oriented programming uses classes to model real-world entities and logic.", difficulty: "MEDIUM", source: "Architecture" },
    { content: "Virtual reality creates an immersive environment for gaming and simulation.", difficulty: "MEDIUM", source: "Future" },
    { content: "API documentation should be clear, concise, and easy for developers to follow.", difficulty: "MEDIUM", source: "Docs" },
    { content: "Microservices architecture breaks down a large app into smaller, independent services.", difficulty: "MEDIUM", source: "System Design" },
    { content: "Lazy loading defers the initialization of an object until the point it is needed.", difficulty: "MEDIUM", source: "Performance" },
    { content: "Standardized testing ensures that code meets quality requirements before release.", difficulty: "MEDIUM", source: "QA" },
    { content: "The Linux kernel is the core of many modern operating systems and servers.", difficulty: "MEDIUM", source: "OS" },
    { content: "Variable hoisting can lead to unexpected behavior if not properly understood.", difficulty: "MEDIUM", source: "JS Internals" },
    { content: "Cache invalidation is one of the two hardest problems in computer science.", difficulty: "MEDIUM", source: "Humor" },

    // --- HARD (Complex syntax, long sentences, symbols, specialized terms) ---
    {
        content: "The fastest typists are not always those who press the keys quickly, but those who combine speed with impeccable accuracy.",
        difficulty: "HARD",
        source: "Pro Tips"
    },
    {
        content: "Typing is not merely pressing keys quickly; it is a combination of focus, muscle memory, and mental agility. Each session challenges your concentration as you learn to maintain speed without sacrificing accuracy.",
        difficulty: "HARD",
        source: "Deep Practice"
    },
    {
        content: "In a world of distributed systems, maintaining consistency across multiple nodes requires robust consensus algorithms like Paxos or Raft to handle network partitions and hardware failures.",
        difficulty: "HARD",
        source: "Distributed Systems"
    },
    {
        content: "Architectural patterns like Model-View-Controller (MVC) or Hexagonal Design help decouple business logic from external dependencies, ensuring long-term maintainability and testability.",
        difficulty: "HARD",
        source: "Design Patterns"
    },
    {
        content: "The intersection of quantum computing and cryptography threatens current RSA encryption standards, necessitating the development of post-quantum cryptographic primitives.",
        difficulty: "HARD",
        source: "Cyber-Frontier"
    },
    {
        content: "Memory management in low-level languages like C requires manual allocation and deallocation, exposing developers to risks like buffer overflows, memory leaks, and dangling pointers.",
        difficulty: "HARD",
        source: "Systems Programming"
    },
    {
        content: "A race condition occurs when multiple threads access shared data simultaneously, leading to unpredictable behavior unless proper synchronization primitives like mutexes or semaphores are implemented.",
        difficulty: "HARD",
        source: "Concurrency"
    },
    {
        content: "Modern compilers perform complex static analysis and optimization passes, including dead code elimination, constant folding, and loop unrolling to maximize execution efficiency on the CPU.",
        difficulty: "HARD",
        source: "Compiler Theory"
    },
    {
        content: "Big O notation provides a mathematical framework to describe the limiting behavior of an algorithm's execution time or space requirements as the input size grows toward infinity.",
        difficulty: "HARD",
        source: "Algorithm Analysis"
    },
    {
        content: "Zero-knowledge proofs allow one party to prove to another that a statement is true without revealing any information beyond the validity of the statement itself, enhancing privacy in blockchain tech.",
        difficulty: "HARD",
        source: "Cryptography"
    },
    {
        content: "The Von Neumann architecture describes a computer design consisting of a processing unit, a control unit, memory, and input/output mechanisms, forming the basis for most modern computers.",
        difficulty: "HARD",
        source: "Hardware History"
    },
    {
        content: "Dependency injection is a design pattern in which an object receives other objects that it depends on, typically used to achieve inversion of control between classes and modules.",
        difficulty: "HARD",
        source: "Software Engineering"
    },
    {
        content: "Heuristics and metaheuristics are strategies used in optimization to find 'good enough' solutions to NP-hard problems where finding an exact solution is computationally prohibitive.",
        difficulty: "HARD",
        source: "Optimization"
    },
    {
        content: "The CAP theorem states that it is impossible for a distributed data store to simultaneously provide more than two out of three guarantees: Consistency, Availability, and Partition Tolerance.",
        difficulty: "HARD",
        source: "System Design"
    },
    {
        content: "Garbage collection algorithms like Mark-and-Sweep or Generational GC automate memory management by identifying and reclaiming heap space occupied by objects that are no longer reachable by the program.",
        difficulty: "HARD",
        source: "Runtime Internals"
    },
    {
        content: "Kernel-level exploits leverage vulnerabilities in the core operating system code to gain elevated privileges, often bypassing user-space security sandbox mechanisms like namespaces or cgroups.",
        difficulty: "HARD",
        source: "Exploit Dev"
    },
    {
        content: "The Fourier Transform is a powerful mathematical tool that decomposes a signal into its constituent frequencies, widely used in digital signal processing, image compression, and audio analysis.",
        difficulty: "HARD",
        source: "Mathematics"
    },
    {
        content: "Lexical scoping defines how variable names are resolved in nested functions: inner functions contain the scope of parent functions even if the parent function has already returned (Closures).",
        difficulty: "HARD",
        source: "JavaScript Ninja"
    },
    {
        content: "Monolithic architectures often suffer from 'spaghetti code' where tight coupling makes it difficult to implement changes without causing unexpected regressions in unrelated parts of the system.",
        difficulty: "HARD",
        source: "Legacy Systems"
    },
    {
        content: "Idempotency ensures that performing an operation multiple times has the same effect as performing it once, a critical property for building reliable and fault-tolerant distributed APIs.",
        difficulty: "HARD",
        source: "API Robustness"
    },
    {
        content: "A neural network consists of layers of interconnected nodes where each connection has a weight that is adjusted during training via backpropagation to minimize the loss function.",
        difficulty: "HARD",
        source: "Deep Learning"
    },
    {
        content: "Tail call optimization is a feature where the compiler reuses the current stack frame for a function call if it is the final action, preventing stack overflow errors in deep recursion.",
        difficulty: "HARD",
        source: "Functional Logic"
    },
    {
        content: "Context switching occurs when the CPU saves the state of a process to switch to another, introducing overhead that can degrade performance if too many threads are active simultaneously.",
        difficulty: "HARD",
        source: "OS Scheduling"
    },
    {
        content: "The Byzantine Generals Problem illustrates the difficulty of reaching consensus in a decentralized network where some participants may be malicious or provide conflicting information to others.",
        difficulty: "HARD",
        source: "Game Theory"
    },
    {
        content: "Strongly-typed languages require explicit definitions of data types, reducing the likelihood of 'undefined is not a function' errors but requiring more verbose code during the initial development phase.",
        difficulty: "HARD",
        source: "Language Design"
    },
    {
        content: "Event-driven architecture relies on the production, detection, and consumption of events to trigger asynchronous workflows, often utilizing message brokers like Kafka or RabbitMQ.",
        difficulty: "HARD",
        source: "Messaging Systems"
    },
    {
        content: "The halting problem is the challenge of determining, from a description of an arbitrary computer program and an input, whether the program will finish running or continue to run forever.",
        difficulty: "HARD",
        source: "Computer Theory"
    },
    {
        content: "In high-frequency trading, every microsecond counts, requiring developers to write highly optimized code that bypasses the standard OS networking stack via techniques like kernel bypass or FPGA logic.",
        difficulty: "HARD",
        source: "High Perf"
    },
    {
        content: "The observer pattern is a behavioral design pattern where an object, called the subject, maintains a list of its dependents, called observers, and notifies them automatically of any state changes.",
        difficulty: "HARD",
        source: "Design Patterns"
    },
    {
        content: "Semantic versioning (SemVer) uses a three-part number (MAJOR.MINOR.PATCH) to communicate the nature of changes in a software release, helping developers manage dependency compatibility.",
        difficulty: "HARD",
        source: "Dev Standards"
    },
    {
        content: "A hash collision occurs when two different inputs produce the same hash output, necessitating resolution strategies like separate chaining or open addressing in hash table implementations.",
        difficulty: "HARD",
        source: "Data Structures"
    },
    {
        content: "The principle of least privilege states that a module must be able to access only the information and resources that are necessary for its legitimate purpose, minimizing the impact of potential breaches.",
        difficulty: "HARD",
        source: "Security Architecture"
    },
    {
        content: "Domain-Driven Design (DDD) emphasizes building a shared understanding between technical and business stakeholders through a 'ubiquitous language' and clearly defined bounded contexts.",
        difficulty: "HARD",
        source: "Business Logic"
    },
    {
        content: "Static site generators pre-render pages into HTML files at build time, offering superior performance and security compared to traditional dynamic sites that render pages on every request.",
        difficulty: "HARD",
        source: "Modern Web"
    }
];

async function main() {
    console.log('Seeding text passages...');

    // Clear dependent tables first to avoid ForeignKeyConstraintViolations
    await prisma.raceResult.deleteMany();
    // Clear existing passages to ensure it's idempotent
    await prisma.textPassage.deleteMany();

    // Batch create the new passages
    await prisma.textPassage.createMany({
        data: passages.map(p => ({
            content: p.content,
            difficulty: p.difficulty,
            source: p.source || "General",
            length: p.content.length,
        }))
    });

    console.log('✅ Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });