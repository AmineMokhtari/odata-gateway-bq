# Third-Party Code Directory

This directory is reserved for any code that Google does not own the copyright to or that Google has not received under Google's Contributor License Agreement.

## Mandatory Requirements

1. **LICENSE File**:
   Every directory inside `third_party` (or 'vendor', etc.) must have a `LICENSE` file that includes the full license text and copyright notice for the library.
   - Always retain original copyright notices and license headers from the original author(s).
   - Do **not** add Google copyright headers or Apache-2.0 boilerplate to third-party code.

2. **Traceability & METADATA**:
   It should also be easy to trace where each directory came from. You are strongly encouraged to include a `METADATA` file for each included package. You can also include third_party metadata in the README file, or as an index in the `third_party` directory.

3. **Standard Package Structure**:
   ```text
   third_party/
   └── <package-name>/
       ├── LICENSE          # Full license text and copyright notice from upstream
       ├── METADATA         # Package origin URL, version, and license type
       └── ...              # Upstream source files
   ```

4. **License Compatibility**:
   Only code under approved open-source licenses compatible with the project's Apache-2.0 license may be included.
