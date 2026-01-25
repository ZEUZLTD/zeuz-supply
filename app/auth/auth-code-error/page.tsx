import Link from 'next/link'

export default function AuthCodeError() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
                <p className="text-gray-600 mb-6">
                    There was an error verifying your login request. The link may have expired or is invalid.
                </p>
                <Link
                    href="/"
                    className="inline-block bg-black text-white font-medium py-2 px-6 rounded hover:bg-gray-800 transition-colors"
                >
                    Return to Home
                </Link>
            </div>
        </div>
    )
}
