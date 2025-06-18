import 'package:flutter/material.dart';
// import 'package:prosecutor_mobile_ffi/prosecutor_mobile_ffi.dart'; // Will be generated

void main() {
  runApp(const ProsecutorApp());
}

class ProsecutorApp extends StatelessWidget {
  const ProsecutorApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Prosecutor Mobile',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo),
        useMaterial3: true,
      ),
      home: const HomePage(title: 'Prosecutor Case Management'),
    );
  }
}

class HomePage extends StatefulWidget {
  const HomePage({super.key, required this.title});

  final String title;

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  String _rustMessage = "Loading...";
  int _caseCount = 0;

  @override
  void initState() {
    super.initState();
    _initializeApp();
  }

  void _initializeApp() async {
    try {
      // Initialize the Rust backend
      // final initResult = await initMobileApp();
      // final appInfo = await getMobileAppInfo();
      // final caseCount = await getCasesCount();
      
      setState(() {
        // _rustMessage = "Rust backend: ${appInfo.version} - ${initResult}";
        // _caseCount = caseCount;
        _rustMessage = "Rust backend ready (FFI not yet connected)";
        _caseCount = 0;
      });
    } catch (e) {
      setState(() {
        _rustMessage = "Error: $e";
      });
    }
  }

  void _createCase() async {
    try {
      // final result = await createCaseMobile("New Case", "Description");
      // print("Case created: $result");
      
      setState(() {
        _caseCount++;
      });
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Case created successfully!')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error creating case: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        title: Text(widget.title),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            const Icon(
              Icons.gavel,
              size: 64,
              color: Colors.indigo,
            ),
            const SizedBox(height: 20),
            Text(
              _rustMessage,
              style: Theme.of(context).textTheme.titleMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            Text(
              'Total Cases: $_caseCount',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: _createCase,
              icon: const Icon(Icons.add),
              label: const Text('Create New Case'),
            ),
            const SizedBox(height: 10),
            ElevatedButton.icon(
              onPressed: () {
                // Navigate to cases list
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const CasesListPage()),
                );
              },
              icon: const Icon(Icons.list),
              label: const Text('View Cases'),
            ),
          ],
        ),
      ),
    );
  }
}

class CasesListPage extends StatelessWidget {
  const CasesListPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Cases'),
      ),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.folder_open, size: 64, color: Colors.grey),
            SizedBox(height: 20),
            Text(
              'No cases yet',
              style: TextStyle(fontSize: 18, color: Colors.grey),
            ),
            SizedBox(height: 10),
            Text(
              'Create your first case to get started',
              style: TextStyle(color: Colors.grey),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.pop(context);
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}
