import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether,
    HRFlowable,
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 755, getattr(self, 'doc_title', 'AssemblyFlow Micro Project Report'))
            self.drawRightString(612 - 54, 755, getattr(self, 'doc_subject', 'Academic Project'))
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(54, 748, 612 - 54, 748)
        
        # Footer (all pages)
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, 45, 612 - 54, 45)
        self.drawString(54, 32, "AssemblyFlow — Micro Project | Live: micro-project-a338.onrender.com")
        self.drawRightString(612 - 54, 32, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()

def build_pdf(filename, title, subject_code_name, content_builder):
    output_path = os.path.join(os.path.dirname(__file__), filename)
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    
    styles = getSampleStyleSheet()
    
    c_primary = colors.HexColor("#1E293B")
    c_secondary = colors.HexColor("#0F766E")
    c_accent = colors.HexColor("#2563EB")
    c_text = colors.HexColor("#334155")
    c_bg_light = colors.HexColor("#F8FAFC")
    c_border = colors.HexColor("#CBD5E1")
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=c_primary,
        spaceAfter=4
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=c_secondary,
        spaceAfter=10
    )
    
    h1_style = ParagraphStyle(
        'H1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=c_primary,
        spaceBefore=12,
        spaceAfter=4,
        keepWithNext=True
    )
    
    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=c_accent,
        spaceBefore=8,
        spaceAfter=3,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=c_text,
        spaceAfter=5
    )
    
    bullet_style = ParagraphStyle(
        'Bullet',
        parent=body_style,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=3
    )
    
    code_style = ParagraphStyle(
        'CodeSnippet',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.2,
        leading=9.8,
        textColor=colors.HexColor("#0F172A"),
        spaceBefore=3,
        spaceAfter=5
    )

    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=10.5,
        textColor=c_text
    )

    table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=10.5,
        textColor=colors.white
    )

    story = []
    
    story.append(Paragraph(title, title_style))
    story.append(Paragraph(f"Subject Micro Project Report: {subject_code_name}", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_secondary, spaceAfter=8))
    
    meta_data = [
        [Paragraph("<b>Student Name:</b>", table_cell), Paragraph("Ashik Ameen", table_cell),
         Paragraph("<b>Subject:</b>", table_cell), Paragraph(subject_code_name, table_cell)],
        [Paragraph("<b>Project:</b>", table_cell), Paragraph("AssemblyFlow", table_cell),
         Paragraph("<b>Academic Term:</b>", table_cell), Paragraph("October 2026", table_cell)],
        [Paragraph("<b>Live Demo:</b>", table_cell), Paragraph('<font color="#2563EB"><u>https://micro-project-a338.onrender.com/</u></font>', table_cell),
         Paragraph("<b>GitHub Repo:</b>", table_cell), Paragraph('<font color="#2563EB"><u>https://github.com/Ashik9500/Micro_project.git</u></font>', table_cell)]
    ]
    t_meta = Table(meta_data, colWidths=[75, 175, 75, 179])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_bg_light),
        ('BOX', (0,0), (-1,-1), 0.5, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 8))
    
    content_builder(story, {
        'h1': h1_style,
        'h2': h2_style,
        'body': body_style,
        'bullet': bullet_style,
        'code': code_style,
        'table_cell': table_cell,
        'table_header': table_header,
        'c_primary': c_primary,
        'c_secondary': c_secondary,
        'c_border': c_border,
        'c_bg_light': c_bg_light,
        'c_accent': c_accent,
    })
    
    def on_first_page(c, d):
        c.doc_title = title
        c.doc_subject = subject_code_name

    def on_later_pages(c, d):
        c.doc_title = title
        c.doc_subject = subject_code_name
        
    doc.build(story, canvasmaker=NumberedCanvas, onFirstPage=on_first_page, onLaterPages=on_later_pages)
    print(f"Generated: {output_path}")

# ============================================================================
# FLAT CONTENT BUILDER
# ============================================================================
def build_flat_content(story, st):
    p = Paragraph
    sp = Spacer
    
    story.append(p("1. Executive Summary & Problem Statement", st['h1']))
    story.append(p(
        "In the design of modern compiler pipelines and assembly tools, lexical scanning and grammar validation "
        "form the indispensable front-end. In the integrated <b>AssemblyFlow</b> micro project, the "
        "<b>Formal Languages and Automata Theory (FLAT)</b> module serves as <b>Stage 1</b>. It normalizes unstructured "
        "assembly source text into categorized token streams, evaluates regular token structures using a formal "
        "Deterministic Finite Automaton (DFA), enforces strict Context-Free Grammar (CFG) production rules, "
        "and implements a safe execution-halting invariant to protect downstream dependency and simulation stages.",
        st['body']
    ))
    
    story.append(p("2. Theoretical Foundations in FLAT", st['h1']))
    story.append(p("2.1 Language Classification under the Chomsky Hierarchy", st['h2']))
    story.append(p(
        "AssemblyFlow models assembly language statements across Chomsky's hierarchy: "
        "<br/>&bull; <b>Type 3 (Regular Languages):</b> Register tokens (R0–R15), immediate integers, and commas "
        "are regular patterns recognized by Finite State Automata. "
        "<br/>&bull; <b>Type 2 (Context-Free Languages):</b> Multi-operand instruction statements with ordered operands "
        "and strict comma delimiters are validated via CFG production rules.",
        st['body']
    ))
    
    story.append(p("2.2 Formal 5-Tuple Register Token DFA: M = (Q, Σ, δ, q0, F)", st['h2']))
    story.append(p(
        "The language of hardware register identifiers <i>L = {R0, R1, ..., R15}</i> (case-insensitive) is recognized "
        "by the formal 5-tuple deterministic finite automaton <b>M = (Q, &Sigma;, &delta;, q0, F)</b>, where:"
        "<br/>&bull; <b>Q:</b> {q0, q1, q2, q3, q4, q5, q_trap}"
        "<br/>&bull; <b>&Sigma;:</b> {'R', 'r', '0', '1', '2'–'9', other}"
        "<br/>&bull; <b>q0:</b> Initial start state."
        "<br/>&bull; <b>F:</b> {q2, q3, q4, q5} (Accepting states for R0, R1, R2–R9, R10–R15 respectively)."
        "<br/>&bull; <b>q_trap:</b> Dead state absorbing all invalid prefixes, out-of-range indices (e.g. R16), and trailing characters.",
        st['body']
    ))
    
    dfa_table_data = [
        [p("<b>Source State</b>", st['table_header']), p("<b>Symbol Class</b>", st['table_header']),
         p("<b>Target State</b>", st['table_header']), p("<b>Automaton Meaning / Description</b>", st['table_header'])],
        [p("q0", st['table_cell']), p("'R', 'r'", st['table_cell']), p("q1", st['table_cell']), p("Valid register prefix recognized", st['table_cell'])],
        [p("q0", st['table_cell']), p("other", st['table_cell']), p("q_trap", st['table_cell']), p("Invalid prefix violation (e.g. 'X', '1')", st['table_cell'])],
        [p("q1", st['table_cell']), p("'0'", st['table_cell']), p("q2 (Accepting)", st['table_cell']), p("Matches register R0", st['table_cell'])],
        [p("q1", st['table_cell']), p("'1'", st['table_cell']), p("q3 (Accepting)", st['table_cell']), p("Matches R1 or initiates tens-digit for R10-R15", st['table_cell'])],
        [p("q1", st['table_cell']), p("'2'–'9'", st['table_cell']), p("q4 (Accepting)", st['table_cell']), p("Matches single-digit registers R2 through R9", st['table_cell'])],
        [p("q3", st['table_cell']), p("'0'–'5'", st['table_cell']), p("q5 (Accepting)", st['table_cell']), p("Matches two-digit registers R10 through R15", st['table_cell'])],
        [p("q3", st['table_cell']), p("'6'–'9'", st['table_cell']), p("q_trap", st['table_cell']), p("R16–R19 exceeds hardware boundary (R0–R15)", st['table_cell'])],
        [p("q4, q5", st['table_cell']), p("any", st['table_cell']), p("q_trap", st['table_cell']), p("Disallows multi-digit registers >= 20 or trailing characters", st['table_cell'])],
        [p("q_trap", st['table_cell']), p("any", st['table_cell']), p("q_trap", st['table_cell']), p("Dead state loops unconditionally on all input", st['table_cell'])],
    ]
    t_dfa = Table(dfa_table_data, colWidths=[70, 75, 80, 279])
    t_dfa.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), st['c_secondary']),
        ('GRID', (0,0), (-1,-1), 0.5, st['c_border']),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
    ]))
    story.append(t_dfa)
    story.append(sp(1, 8))
    
    story.append(p("2.3 Context-Free Grammar Production Rules (EBNF)", st['h2']))
    story.append(p(
        "AssemblyFlow enforces the following formal instruction production rules:<br/>"
        "&bull; <code>LOAD destinationRegister, integer</code> (Immediate Load)<br/>"
        "&bull; <code>MOV destinationRegister, sourceRegister</code> (Register Transfer)<br/>"
        "&bull; <code>ADD destinationRegister, sourceRegister1, sourceRegister2</code> (ALU Addition)<br/>"
        "&bull; <code>SUB destinationRegister, sourceRegister1, sourceRegister2</code> (ALU Subtraction)",
        st['body']
    ))
    
    story.append(p("3. System Implementation & Architecture in AssemblyFlow", st['h1']))
    story.append(p(
        "The FLAT engine is implemented in TypeScript within <code>assemblyflow/backend/src/services/flat/</code>:<br/>"
        "&bull; <b><code>tokenizer.ts</code>:</b> Scans lines in O(N) linear time, identifying opcodes, registers, integer literals, commas, and comments while logging 1-indexed column coordinates.<br/>"
        "&bull; <b><code>dfa.ts</code>:</b> Simulates the formal 5-tuple automaton, producing comprehensive transition step diagnostics.<br/>"
        "&bull; <b><code>validator.ts</code>:</b> Checks operand counts, comma positions, and register bounds, generating clean <code>InstructionAST</code> nodes.<br/>"
        "&bull; <b>Stage-Level Safety Halting:</b> If any syntax or lexical error is detected, the server responds with HTTP 400 and immediately terminates execution before Stages 2 (DAA) and 3 (COA) can execute.",
        st['body']
    ))
    
    story.append(p("4. Experimental Test Cases & Verification", st['h1']))
    exp_table_data = [
        [p("<b>Test Case</b>", st['table_header']), p("<b>Input Assembly Statement</b>", st['table_header']),
         p("<b>FLAT Evaluation</b>", st['table_header']), p("<b>Pipeline Result</b>", st['table_header'])],
        [p("Valid Load", st['table_cell']), p("<code>LOAD R1, 100</code>", st['table_cell']), p("Accepted: Valid opcode, R1 in range, valid integer", st['table_cell']), p("Passes to Stage 2 (DAA)", st['table_cell'])],
        [p("Valid ALU", st['table_cell']), p("<code>ADD R3, R1, R2</code>", st['table_cell']), p("Accepted: Valid 3-operand register syntax", st['table_cell']), p("Passes to Stage 2 (DAA)", st['table_cell'])],
        [p("Out-of-Bounds Reg", st['table_cell']), p("<code>MOV R16, R1</code>", st['table_cell']), p("Rejected: R16 transitions to q_trap (Exceeds R15)", st['table_cell']), p("HALT: HTTP 400 (FLAT Error)", st['table_cell'])],
        [p("Missing Operand", st['table_cell']), p("<code>ADD R1, R2</code>", st['table_cell']), p("Rejected: Expected 3 operands, found 2", st['table_cell']), p("HALT: HTTP 400 (FLAT Error)", st['table_cell'])],
        [p("Unknown Opcode", st['table_cell']), p("<code>MUL R1, R2</code>", st['table_cell']), p("Rejected: Opcode 'MUL' not in supported set", st['table_cell']), p("HALT: HTTP 400 (FLAT Error)", st['table_cell'])],
    ]
    t_exp = Table(exp_table_data, colWidths=[90, 120, 164, 130])
    t_exp.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), st['c_secondary']),
        ('GRID', (0,0), (-1,-1), 0.5, st['c_border']),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
    ]))
    story.append(t_exp)
    story.append(sp(1, 8))
    
    story.append(p("5. Asymptotic Complexity & Conclusions", st['h1']))
    story.append(p(
        "<b>Time Complexity:</b> Line scanning and tokenization execute in O(L) time per line, yielding O(N) total time for a program of N characters. DFA transition verification executes in O(1) time per token (string length &le; 4). Total parsing complexity is strictly optimal linear time O(N).<br/>"
        "<b>Learning Outcomes:</b> Practical software engineering demonstration of finite automata, formal language grammars, lexical token classification, and compiler front-end error recovery.",
        st['body']
    ))

# ============================================================================
# COA CONTENT BUILDER
# ============================================================================
def build_coa_content(story, st):
    p = Paragraph
    sp = Spacer
    
    story.append(p("1. Executive Summary & Problem Statement", st['h1']))
    story.append(p(
        "Pipelining is the core microarchitectural technique employed in modern microprocessors to maximize "
        "instruction throughput by overlapping execution phases. In <b>AssemblyFlow</b>, the "
        "<b>Computer Organization and Architecture (COA)</b> module functions as <b>Stage 3</b>. It simulates "
        "cycle-by-cycle execution of verified assembly code across the classic <b>5-stage RISC pipeline</b> "
        "(IF, ID, EX, MEM, WB), evaluates <b>Read-After-Write (RAW)</b> data hazards, manages <b>split-phase "
        "register file timing</b>, models <b>stall bubble insertion</b>, and provides an interactive demonstration of "
        "<b>hardware data forwarding</b>.",
        st['body']
    ))
    
    story.append(p("2. Theoretical Foundations in Computer Architecture", st['h1']))
    story.append(p("2.1 Classic 5-Stage RISC Pipeline Model", st['h2']))
    story.append(p(
        "The simulator implements the canonical five-stage in-order RISC microarchitecture:<br/>"
        "&bull; <b>IF (Instruction Fetch):</b> Fetches instruction from instruction memory into the IF/ID pipeline register.<br/>"
        "&bull; <b>ID (Instruction Decode / Register Read):</b> Decodes opcode, reads source registers from the dual-port Register File, and checks for hazards.<br/>"
        "&bull; <b>EX (Execution / Effective Address):</b> The ALU executes arithmetic operations (ADD, SUB) or passes operands.<br/>"
        "&bull; <b>MEM (Memory Access):</b> Memory cache stage (immediate loads pass through to MEM/WB register).<br/>"
        "&bull; <b>WB (Write-Back):</b> Commits result to the destination register in the Register File.",
        st['body']
    ))
    
    story.append(p("2.2 Split-Phase Register File Timing", st['h2']))
    story.append(p(
        "AssemblyFlow models <b>split-phase register file clocking</b>: register writes occur during the <i>first half "
        "of the clock cycle</i> (0 to T/2) in WB, while register reads occur during the <i>second half of the cycle</i> "
        "(T/2 to T) in ID. Thus, if instruction I1 is in WB in cycle C, instruction I2 can safely read the updated "
        "register in ID during the very same cycle C without needing an extra stall cycle.",
        st['body']
    ))
    
    story.append(p("2.3 Data Hazards: Stall Bubbles vs. Hardware Forwarding", st['h2']))
    story.append(p(
        "A <b>Read-After-Write (RAW)</b> hazard arises when consumer instruction I2 requires a register written by producer I1:<br/>"
        "&bull; <b>Baseline Interlock (Forwarding Disabled):</b> I2 is held in ID until I1 commits to the register file in WB. "
        "Two NOP stall bubbles are injected into EX, delaying subsequent instructions.<br/>"
        "&bull; <b>Hardware Data Forwarding (Bypassing Enabled):</b> Dedicated multiplexers route ALU outputs from EX/MEM "
        "directly to EX stage ALU inputs, eliminating RAW stalls for ALU instructions (0 stall cycles).",
        st['body']
    ))
    
    story.append(p("3. Mathematical Performance Formulations", st['h1']))
    story.append(p(
        "For N instructions executed across k = 5 pipeline stages:<br/>"
        "&bull; <b>Non-Pipelined Cycles:</b> C_non_pipelined = N &times; 5<br/>"
        "&bull; <b>Ideal Pipelined Cycles:</b> C_ideal = N + (k - 1) = N + 4<br/>"
        "&bull; <b>Actual Cycles (with Stalls):</b> C_actual = N + 4 + &Sigma; Stalls<br/>"
        "&bull; <b>Cycles Per Instruction (CPI):</b> CPI = C_actual / N<br/>"
        "&bull; <b>Speedup (S):</b> S = C_non_pipelined / C_actual = (5 &times; N) / C_actual",
        st['body']
    ))
    
    story.append(p("4. Experimental Benchmark: 3-Instruction RAW Dependency Chain", st['h1']))
    story.append(p(
        "Benchmark program: <code>LOAD R1, 10</code> &rarr; <code>ADD R2, R1, R3</code> &rarr; <code>SUB R4, R2, R5</code>",
        st['body']
    ))
    
    coa_bench_data = [
        [p("<b>Metric / Parameter</b>", st['table_header']), p("<b>Forwarding Disabled (Default)</b>", st['table_header']),
         p("<b>Forwarding Enabled</b>", st['table_header']), p("<b>Microarchitectural Gain</b>", st['table_header'])],
        [p("Total Clock Cycles", st['table_cell']), p("11 CC", st['table_cell']), p("7 CC", st['table_cell']), p("<b>36.4% Cycle Reduction</b>", st['table_cell'])],
        [p("Injected Stall Bubbles", st['table_cell']), p("4 Stalls (2 for I2, 2 for I3)", st['table_cell']), p("0 Stalls", st['table_cell']), p("<b>100% Bubbles Eliminated</b>", st['table_cell'])],
        [p("Cycles Per Instruction (CPI)", st['table_cell']), p("3.67", st['table_cell']), p("2.33", st['table_cell']), p("<b>36.5% CPI Improvement</b>", st['table_cell'])],
        [p("Pipeline Speedup (vs Non-Pipelined)", st['table_cell']), p("1.36x", st['table_cell']), p("2.14x", st['table_cell']), p("<b>+57.4% Throughput Boost</b>", st['table_cell'])],
    ]
    t_coa = Table(coa_bench_data, colWidths=[130, 134, 110, 130])
    t_coa.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), st['c_secondary']),
        ('GRID', (0,0), (-1,-1), 0.5, st['c_border']),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_coa)
    story.append(sp(1, 8))
    
    story.append(p("Timing Matrix with Forwarding Disabled (11 Cycles):", st['h2']))
    story.append(p(
        "<code>I1: [IF] [ID] [EX] [MEM] [WB]</code><br/>"
        "<code>I2:  --  [IF] (STALL) (STALL) [ID] [EX] [MEM] [WB]</code><br/>"
        "<code>I3:  --   --    --      --   [IF] (STALL) (STALL) [ID] [EX] [MEM] [WB]</code>",
        st['code']
    ))
    
    story.append(p("Timing Matrix with Forwarding Enabled (7 Cycles):", st['h2']))
    story.append(p(
        "<code>I1: [IF] [ID] [EX] [MEM] [WB]</code><br/>"
        "<code>I2:  --  [IF] [ID] [EX] [MEM] [WB]  (Operand forwarded from I1 EX stage)</code><br/>"
        "<code>I3:  --   --  [IF] [ID] [EX] [MEM] [WB]  (Operand forwarded from I2 EX stage)</code>",
        st['code']
    ))
    
    story.append(p("5. Conclusions & Learning Outcomes", st['h1']))
    story.append(p(
        "The COA pipeline simulation engine models actual RISC microarchitectural execution with complete fidelity. "
        "Students can observe the direct physical consequences of data dependencies, verify the split-phase register file "
        "assumptions, and dynamically quantify the throughput gains delivered by hardware forwarding bypass paths.",
        st['body']
    ))

# ============================================================================
# DAA CONTENT BUILDER
# ============================================================================
def build_daa_content(story, st):
    p = Paragraph
    sp = Spacer
    
    story.append(p("1. Executive Summary & Problem Statement", st['h1']))
    story.append(p(
        "In optimizing compilers and modern computer architectures, instruction scheduling determines an execution "
        "sequence that minimizes pipeline hazard stalls while strictly preserving data integrity. In <b>AssemblyFlow</b>, "
        "the <b>Design and Analysis of Algorithms (DAA)</b> module serves as <b>Stage 2</b>. It applies "
        "<b>Bernstein's Conditions for Concurrency</b> to extract register read/write footprints, constructs a "
        "<b>Directed Acyclic Graph (DAG)</b> with consolidated multi-hazard edges, and computes valid instruction "
        "orderings using <b>Kahn's Topological Sorting Algorithm</b> in optimal <b>O(V + E)</b> time with deterministic tie-breaking.",
        st['body']
    ))
    
    story.append(p("2. Theoretical Foundations in DAA", st['h1']))
    story.append(p("2.1 Register Usage Sets & Bernstein's Conditions", st['h2']))
    story.append(p(
        "For each instruction I, the algorithm extracts its Read Set R(I) and Write Set W(I). For any pair I_i, I_j with i < j:<br/>"
        "&bull; <b>RAW (Read-After-Write / True Dependency):</b> W(I_i) &cap; R(I_j) &ne; &empty;. I_j reads data written by I_i.<br/>"
        "&bull; <b>WAR (Write-After-Read / Anti-Dependency):</b> R(I_i) &cap; W(I_j) &ne; &empty;. I_j overwrites data read by I_i.<br/>"
        "&bull; <b>WAW (Write-After-Write / Output Dependency):</b> W(I_i) &cap; W(I_j) &ne; &empty;. Both instructions write to the same register.",
        st['body']
    ))
    
    story.append(p("2.2 Directed Acyclic Graph (DAG) Modeling & Edge Consolidation", st['h2']))
    story.append(p(
        "Precedence constraints are modeled as a DAG G = (V, E), where V represents instruction nodes and E represents directed "
        "precedence edges. AssemblyFlow implements <b>Edge Consolidation</b>: when two instructions share multiple hazards "
        "(e.g., RAW and WAW simultaneously), they are represented by a single consolidated edge with composite annotations, "
        "avoiding redundant multi-edges.",
        st['body']
    ))
    
    story.append(p("2.3 Kahn's Algorithm for Topological Sorting", st['h2']))
    story.append(p(
        "Kahn's algorithm operates on in-degrees (deg&minus;(v)):<br/>"
        "1. Calculate in-degree for all vertices v in V.<br/>"
        "2. Add all vertices with deg&minus;(v) = 0 to candidate set S.<br/>"
        "3. While S is non-empty:<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&bull; <b>Tie-Breaking:</b> Pick vertex u in S with lowest instruction index.<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&bull; Append u to topological schedule L.<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&bull; For each successor w of u: decrement deg&minus;(w). If deg&minus;(w) == 0, insert w into S.<br/>"
        "4. <b>Cycle Detection:</b> If |L| &lt; |V|, a directed cycle exists, halting the pipeline.",
        st['body']
    ))
    
    story.append(p("3. Step-by-Step Kahn Trace Example", st['h1']))
    story.append(p("Instruction Stream: I1: LOAD R1, 10 | I2: ADD R2, R1, R3 | I3: SUB R4, R2, R5", st['h2']))
    
    trace_data = [
        [p("<b>Step</b>", st['table_header']), p("<b>Candidate Set S</b>", st['table_header']),
         p("<b>Selected Vertex</b>", st['table_header']), p("<b>In-Degree Updates</b>", st['table_header']), p("<b>Resulting Order L</b>", st['table_header'])],
        [p("1", st['table_cell']), p("{ I1 }", st['table_cell']), p("I1", st['table_cell']), p("I2 in-degree decremented: 1 &rarr; 0", st['table_cell']), p("[ I1 ]", st['table_cell'])],
        [p("2", st['table_cell']), p("{ I2 }", st['table_cell']), p("I2", st['table_cell']), p("I3 in-degree decremented: 1 &rarr; 0", st['table_cell']), p("[ I1, I2 ]", st['table_cell'])],
        [p("3", st['table_cell']), p("{ I3 }", st['table_cell']), p("I3", st['table_cell']), p("No successors remaining", st['table_cell']), p("[ I1, I2, I3 ]", st['table_cell'])],
    ]
    t_trace = Table(trace_data, colWidths=[35, 95, 80, 164, 130])
    t_trace.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), st['c_secondary']),
        ('GRID', (0,0), (-1,-1), 0.5, st['c_border']),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_trace)
    story.append(sp(1, 8))
    
    story.append(p("4. Asymptotic Complexity Analysis", st['h1']))
    daa_comp_data = [
        [p("<b>Algorithm Phase</b>", st['table_header']), p("<b>Time Complexity</b>", st['table_header']),
         p("<b>Space Complexity</b>", st['table_header']), p("<b>Analysis & Derivation</b>", st['table_header'])],
        [p("Read/Write Set Extraction", st['table_cell']), p("O(V)", st['table_cell']), p("O(V)", st['table_cell']), p("Fixed operand count (&le; 3) per instruction node", st['table_cell'])],
        [p("DAG Edge Construction", st['table_cell']), p("O(V^2)", st['table_cell']), p("O(V + E)", st['table_cell']), p("Pairwise Bernstein evaluation for all i < j", st['table_cell'])],
        [p("Kahn's Topological Sort", st['table_cell']), p("O(V + E)", st['table_cell']), p("O(V + E)", st['table_cell']), p("Each vertex and edge processed exactly once", st['table_cell'])],
        [p("Cycle Detection", st['table_cell']), p("O(1)", st['table_cell']), p("O(1)", st['table_cell']), p("Comparison of result list length |L| against |V|", st['table_cell'])],
    ]
    t_comp = Table(daa_comp_data, colWidths=[120, 80, 80, 224])
    t_comp.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), st['c_secondary']),
        ('GRID', (0,0), (-1,-1), 0.5, st['c_border']),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_comp)
    story.append(sp(1, 8))
    
    story.append(p("5. Conclusions & Learning Outcomes", st['h1']))
    story.append(p(
        "The DAA module bridges mathematical graph theory with practical compiler optimization. Students witness "
        "how abstract concepts like in-degrees, DAGs, Bernstein's concurrency conditions, and Kahn's algorithm "
        "directly determine valid execution schedules and prevent data corruption in pipelined processors.",
        st['body']
    ))

# ============================================================================
# MAIN ENTRYPOINT
# ============================================================================
if __name__ == '__main__':
    print("Compiling academic PDF reports...")
    build_pdf(
        "FLAT_MicroProject_Report.pdf",
        "AssemblyFlow: Pipelined Execution Analyzer",
        "Formal Languages & Automata Theory (FLAT)",
        build_flat_content
    )
    build_pdf(
        "COA_MicroProject_Report.pdf",
        "AssemblyFlow: Pipelined Execution Analyzer",
        "Computer Organization & Architecture (COA)",
        build_coa_content
    )
    build_pdf(
        "DAA_MicroProject_Report.pdf",
        "AssemblyFlow: Pipelined Execution Analyzer",
        "Design & Analysis of Algorithms (DAA)",
        build_daa_content
    )
    print("All 3 PDF reports successfully generated!")
