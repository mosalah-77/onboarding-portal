import Link from 'next/link';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';

export default function Guide() {
  return <div className="app guide-page"><header className="bar"><Link className="logo" href="/"><Logo /></Link><Link href="/">Open the demo</Link><div className="view lone"><ThemeToggle /></div></header>
    <main className="guide"><h1>How it works</h1>
      <p>Jackie, Viktor and their companies are made up, and switching seats is a shortcut for signing in as someone else. The rest is real. Answers go into a database, files go into storage, and the server decides who may see what. This page follows one brief through all of it.</p>

      <h2>When Jackie answers a question</h2>
      <p>Say Jackie answers &ldquo;Who are you trying to reach?&rdquo; with &ldquo;Drivers within a few miles of the shop&rdquo;. The browser sends the whole brief with that answer in it, plus the version token it last saw and a retry key. The server then does four things.</p>
      <ol>
        <li>It reads the session cookie to work out who is asking, and checks that their seat belongs to the project&rsquo;s workspace.</li>
        <li>It checks the brief: the right types, sensible lengths, a date that exists on a calendar. A half-finished brief is fine at this point.</li>
        <li>It writes the new revision, a receipt for the retry key and an activity entry in one SQL batch, and points the project at the new revision.</li>
        <li>It sends the saved project back, and the page redraws the conversation from that. This is why a reload shows the same thread, and so does the other seat.</li>
      </ol>
      <p>Each answer is a new row in a table called <code>versions</code>, in Cloudflare D1. Old rows are never edited. The version number on screen counts something else, though: how many times the brief has been sent. Version 1 is the first brief Viktor reads, however many answers it took to get there.</p>
      <table><thead><tr><th>What goes wrong</th><th>What the server does</th><th>Tested by</th></tr></thead><tbody>
        <tr><td>Two tabs save at once</td><td>One wins. The other gets a 409 and the page loads the saved brief.</td><td>Concurrent-save API test</td></tr>
        <tr><td>The save works but the reply never arrives</td><td>Trying again with the same retry key returns the first result. Nothing is saved twice.</td><td>Lost-response API test</td></tr>
        <tr><td>A required answer is missing</td><td>Saving still works. Sending is refused, with a list of what is missing.</td><td>Readiness tests</td></tr>
        <tr><td>Jackie opens a link to the other client&rsquo;s project</td><td>404, the same answer a project that doesn&rsquo;t exist would get.</td><td>Tenant-boundary API test</td></tr>
      </tbody></table>

      <h2>Files</h2>
      <p>A file&rsquo;s details go in the <code>assets</code> table. Its bytes go in a separate table, <code>objects</code>, that only the server reads. (The bytes are in D1 because R2 asks for a payment card even on its free tier. That is also why a file stops at 1.9 MB: a D1 row holds 2 MB.)</p>
      <ol>
        <li>Check membership, size, filename, declared type and the file&rsquo;s signature.</li>
        <li>Reserve an upload slot and the space with a pending row.</li>
        <li>Write the bytes as a new object. An accepted file is never overwritten.</li>
        <li>Mark the row ready. Only now can an answer attach the file.</li>
      </ol>
      <p>If the write fails, the brief is untouched. If the write works and the status update fails, the pending row and the object wait, and choosing the same file again picks up where it stopped.</p>
      <p>Knowing a file&rsquo;s URL gets you nothing. Every download checks membership first, and someone else&rsquo;s file returns the same 404 as one that was never uploaded. The signature check is not a virus scan, so please only upload made-up files.</p>

      <h2>Sending, changes and approval</h2>
      <p>Only the studio seat can approve, and only the revision that was sent. The approval stores that revision&rsquo;s ID, and the handoff reads from it even when a newer draft exists.</p>
      <ol>
        <li>Jackie sends version 1. Every required answer has to be in. If Jackie edits an answer after sending, the brief goes back to draft.</li>
        <li>Viktor asks for changes. His note is saved in the activity history and appears in the thread.</li>
        <li>Jackie changes an answer, which makes a new revision, and sends version 2.</li>
        <li>Viktor approves version 2. He can reopen it later if he gives a reason, and version 2 stays the agreed scope until he approves another.</li>
      </ol>
      <p>If Jackie skips the launch date, the first-jobs list tells the studio to agree one. If there is a date, the list says to review it. Either way the date is a request.</p>
    </main></div>;
}
